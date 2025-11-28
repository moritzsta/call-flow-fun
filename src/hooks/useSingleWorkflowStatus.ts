import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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

  return {
    workflow: query.data,
    isRunning: query.data?.status === 'running' || query.data?.status === 'alive',
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
