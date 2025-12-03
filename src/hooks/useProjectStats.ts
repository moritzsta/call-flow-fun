import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProjectStats {
  companiesCount: number;
  emailsCount: number;
}

export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: async (): Promise<ProjectStats> => {
      const [companiesResult, emailsResult] = await Promise.all([
        supabase
          .from('companies')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId),
        supabase
          .from('project_emails')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId),
      ]);

      return {
        companiesCount: companiesResult.count ?? 0,
        emailsCount: emailsResult.count ?? 0,
      };
    },
    enabled: !!projectId,
    staleTime: 30000,
  });
};
