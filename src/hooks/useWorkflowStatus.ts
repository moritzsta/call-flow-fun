import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowState {
  id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  project_id: string;
  user_id: string;
  trigger_data: Record<string, any> | null;
  result_summary: Record<string, any> | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowStatusCounts {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
}

export const useWorkflowStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<WorkflowStatusCounts>({
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });

  // Fetch workflow states
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflow-states', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkflowState[];
    },
    enabled: !!projectId,
  });

  // Calculate counts
  useEffect(() => {
    if (!workflows) return;

    const newCounts = workflows.reduce(
      (acc, workflow) => {
        acc[workflow.status]++;
        acc.total++;
        return acc;
      },
      { pending: 0, running: 0, completed: 0, failed: 0, total: 0 }
    );

    setCounts(newCounts);
  }, [workflows]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`workflow-states:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_workflow_states',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[useWorkflowStatus] INSERT:', payload);
          
          // Add new workflow to cache
          queryClient.setQueryData<WorkflowState[]>(
            ['workflow-states', projectId],
            (old = []) => [payload.new as WorkflowState, ...old]
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'n8n_workflow_states',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[useWorkflowStatus] UPDATE:', payload);
          
          // Update workflow in cache
          queryClient.setQueryData<WorkflowState[]>(
            ['workflow-states', projectId],
            (old = []) =>
              old.map((w) =>
                w.id === payload.new.id ? (payload.new as WorkflowState) : w
              )
          );
        }
      )
      .subscribe();

    return () => {
      console.log('[useWorkflowStatus] Cleanup subscription');
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return {
    workflows,
    counts,
    isLoading,
  };
};
