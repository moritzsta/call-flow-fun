import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface WorkflowState {
  id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'alive';
  created_at: string;
  started_at: string;
  completed_at: string | null;
  trigger_data: any;
  result_summary: any;
  loop_count: number;
  conversation_active: boolean | null;
  last_message_at: string | null;
}

export const useSingleWorkflowStatus = (projectId: string, workflowName: string) => {
  const queryKey = ['single-workflow-status', projectId, workflowName];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select('*')
        .eq('project_id', projectId)
        .eq('workflow_name', workflowName)
        .in('status', ['running', 'alive'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WorkflowState | null;
    },
    enabled: !!projectId && !!workflowName,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId || !workflowName) return;

    const channel = supabase
      .channel(`workflow-${workflowName}-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'n8n_workflow_states',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newWorkflow = payload.new as WorkflowState;
          if (newWorkflow.workflow_name === workflowName) {
            query.refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, workflowName, query]);

  // Watchdog: Automatisch erkennen wenn Workflow stecken bleibt (5 Minuten Timeout)
  useEffect(() => {
    const workflow = query.data;
    if (!workflow || (workflow.status !== 'running' && workflow.status !== 'alive')) return;

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 Minuten
    const CHECK_INTERVAL = 30 * 1000; // Check alle 30 Sekunden

    console.log('[useSingleWorkflowStatus] Starting watchdog for:', workflowName);

    const watchdog = setInterval(async () => {
      // Aktuellen Status aus DB holen
      const { data: currentWorkflow } = await supabase
        .from('n8n_workflow_states')
        .select('id, workflow_name, status, updated_at')
        .eq('project_id', projectId)
        .eq('workflow_name', workflowName)
        .in('status', ['running', 'alive'])
        .maybeSingle();

      if (!currentWorkflow) {
        clearInterval(watchdog);
        return;
      }

      const timeSinceUpdate = Date.now() - new Date(currentWorkflow.updated_at).getTime();
      
      if (timeSinceUpdate >= INACTIVITY_TIMEOUT) {
        console.warn(`[useSingleWorkflowStatus] Workflow ${workflowName} stuck for ${Math.floor(timeSinceUpdate / 1000)}s - marking as failed`);
        
        // Workflow als failed markieren
        await supabase
          .from('n8n_workflow_states')
          .update({ status: 'failed' })
          .eq('id', currentWorkflow.id);

        toast.error(
          `Workflow "${workflowName}" wurde nach 5 Minuten Inaktivität als fehlgeschlagen markiert.`,
          { duration: 5000 }
        );
        
        query.refetch();
        clearInterval(watchdog);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(watchdog);
  }, [query.data?.status, query.data?.id, projectId, workflowName, query]);

  return {
    workflow: query.data,
    isRunning: query.data?.status === 'running' || query.data?.status === 'alive',
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
