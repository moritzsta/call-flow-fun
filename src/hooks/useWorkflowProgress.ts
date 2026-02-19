import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowProgressData {
  felixCount: number;
  annaCount: number;
  paulCount: number;
  brittaCount: number;
  isLoading: boolean;
}

export const useWorkflowProgress = (projectId: string | undefined, isRunning: boolean): WorkflowProgressData => {
  // Felix: Count all companies found in this project
  const { data: felixCount = 0, isLoading: felixLoading } = useQuery({
    queryKey: ['workflow-progress', 'felix', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    refetchInterval: isRunning ? 5000 : false,
  });

  // Anna: Count companies with analysis filled
  const { data: annaCount = 0, isLoading: annaLoading } = useQuery({
    queryKey: ['workflow-progress', 'anna', projectId],
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

  // Paul: Count all project emails
  const { data: paulCount = 0, isLoading: paulLoading } = useQuery({
    queryKey: ['workflow-progress', 'paul', projectId],
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

  // Britta: Count emails with body_improved filled
  const { data: brittaCount = 0, isLoading: brittaLoading } = useQuery({
    queryKey: ['workflow-progress', 'britta', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from('project_emails')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .not('body_improved', 'is', null)
        .neq('body_improved', '');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
    refetchInterval: isRunning ? 5000 : false,
  });

  return {
    felixCount,
    annaCount,
    paulCount,
    brittaCount,
    isLoading: felixLoading || annaLoading || paulLoading || brittaLoading,
  };
};
