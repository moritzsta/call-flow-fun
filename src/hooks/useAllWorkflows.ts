import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkflowState {
  id: string;
  project_id: string;
  user_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger_data: any | null;
  result_summary: any | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project_title?: string;
  organization_name?: string;
}

export const useAllWorkflows = () => {
  const { user } = useAuth();

  const { data: workflows = [], isLoading, error, refetch } = useQuery({
    queryKey: ['all_workflows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select(`
          *,
          projects!n8n_workflow_states_project_id_fkey (
            title,
            organizations!projects_organization_id_fkey (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((workflow: any) => ({
        ...workflow,
        project_title: workflow.projects?.title || null,
        organization_name: workflow.projects?.organizations?.name || null,
        projects: undefined,
      })) as WorkflowState[];
    },
    enabled: !!user?.id,
  });

  return {
    workflows,
    isLoading,
    error,
    refetch,
  };
};
