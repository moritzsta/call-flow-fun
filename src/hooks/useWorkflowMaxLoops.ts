import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowMaxLoops {
  annaMaxLoops: number;
  paulMaxLoops: number;
  brittaMaxLoops: number;
  isLoading: boolean;
}

export const useWorkflowMaxLoops = (
  projectId: string | undefined, 
  isRunning: boolean
): WorkflowMaxLoops => {
  // Anna: Count companies with website
  const { data: annaMaxLoops = 0, isLoading: annaLoading } = useQuery({
    queryKey: ['workflow-max-loops', 'anna', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .not('website', 'is', null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    refetchInterval: isRunning ? 5000 : false,
  });

  // Paul: Count companies with analysis
  const { data: paulMaxLoops = 0, isLoading: paulLoading } = useQuery({
    queryKey: ['workflow-max-loops', 'paul', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .not('analysis', 'is', null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    refetchInterval: isRunning ? 5000 : false,
  });

  // Britta: Count all project emails
  const { data: brittaMaxLoops = 0, isLoading: brittaLoading } = useQuery({
    queryKey: ['workflow-max-loops', 'britta', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from('project_emails')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    refetchInterval: isRunning ? 5000 : false,
  });

  return {
    annaMaxLoops,
    paulMaxLoops,
    brittaMaxLoops,
    isLoading: annaLoading || paulLoading || brittaLoading,
  };
};
