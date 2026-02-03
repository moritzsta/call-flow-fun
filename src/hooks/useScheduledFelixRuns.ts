import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledFelixRun {
  id: string;
  project_id: string;
  user_id: string;
  city: string;
  state: string;
  category: string;
  max_companies: number | null;
  scheduled_at: string;
  status: string;
  workflow_state_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const useScheduledFelixRuns = (projectId: string) => {
  return useQuery({
    queryKey: ['scheduled-felix-runs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_felix_runs')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'triggered'])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as ScheduledFelixRun[];
    },
    enabled: !!projectId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
