import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WorkflowMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface UseWorkflowChatOptions {
  workflowName: 'finder_felix' | 'analyse_anna' | 'pitch_paul';
  projectId: string;
  initialWorkflowStateId?: string;
}

export const useWorkflowChat = ({
  workflowName,
  projectId,
  initialWorkflowStateId,
}: UseWorkflowChatOptions) => {
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [workflowStateId, setWorkflowStateId] = useState(initialWorkflowStateId);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load existing workflow state on mount
  useEffect(() => {
    if (initialWorkflowStateId || !projectId || !user) return;

    const loadExistingWorkflowState = async () => {
      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select('id')
        .eq('project_id', projectId)
        .eq('workflow_name', workflowName)
        .eq('user_id', user.id)
        .eq('conversation_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        console.log(`[useWorkflowChat] Loaded existing workflow state: ${data.id}`);
        setWorkflowStateId(data.id);
      }
    };

    loadExistingWorkflowState();
  }, [projectId, workflowName, user, initialWorkflowStateId]);

  // Fetch initial messages when workflowStateId is available
  useEffect(() => {
    if (!workflowStateId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('workflow_messages')
        .select('*')
        .eq('workflow_state_id', workflowStateId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data) {
        setMessages(data as WorkflowMessage[]);
      }
    };

    fetchMessages();
  }, [workflowStateId]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!workflowStateId) return;

    const channel = supabase
      .channel(`workflow-messages:${workflowStateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_messages',
          filter: `workflow_state_id=eq.${workflowStateId}`,
        },
        (payload) => {
          const newMessage = payload.new as WorkflowMessage;
          
          // Prevent duplicates by checking if message already exists
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // Stop loading when assistant responds
          if (newMessage.role === 'assistant') {
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowStateId]);

  const sendMessage = async (content: string) => {
    if (!user) {
      toast.error('Sie müssen eingeloggt sein');
      return;
    }

    setIsLoading(true);

    try {
      let currentWorkflowStateId = workflowStateId;

      // Create workflow state if this is a new conversation
      if (!currentWorkflowStateId) {
        const { data: newState, error: stateError } = await supabase
          .from('n8n_workflow_states')
          .insert({
            project_id: projectId,
            user_id: user.id,
            workflow_name: workflowName,
            status: 'running',
            conversation_active: true,
            trigger_data: { initial_message: content },
          })
          .select()
          .single();

        if (stateError || !newState) {
          throw new Error('Fehler beim Erstellen des Workflow-Status');
        }

        currentWorkflowStateId = newState.id;
        setWorkflowStateId(currentWorkflowStateId);
      }

      // Save user message
      const { data: userMessage, error: messageError } = await supabase
        .from('workflow_messages')
        .insert({
          workflow_state_id: currentWorkflowStateId,
          project_id: projectId,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      if (userMessage) {
        setMessages((prev) => [...prev, userMessage as WorkflowMessage]);
      }

      // Trigger n8n webhook
      const { error: triggerError } = await supabase.functions.invoke('trigger-n8n-workflow', {
        body: {
          workflow_name: workflowName,
          workflow_id: currentWorkflowStateId,
          project_id: projectId,
          user_id: user.id,
          message: content,
        },
      });

      if (triggerError) {
        throw triggerError;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht');
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    workflowStateId,
  };
};
