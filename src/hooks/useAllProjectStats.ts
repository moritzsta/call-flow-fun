import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface ProjectStatsMap {
  [projectId: string]: {
    companiesCount: number;
    emailsCount: number;
    score: number;
  };
}

export const useAllProjectStats = (projectIds: string[]) => {
  return useQuery({
    queryKey: ['all-project-stats', projectIds],
    queryFn: async (): Promise<ProjectStatsMap> => {
      if (projectIds.length === 0) return {};

      // Fetch all companies and emails counts in bulk
      const [companiesResult, emailsResult] = await Promise.all([
        supabase
          .from('companies')
          .select('project_id')
          .in('project_id', projectIds),
        supabase
          .from('project_emails')
          .select('project_id')
          .in('project_id', projectIds),
      ]);

      // Count per project
      const companiesByProject: Record<string, number> = {};
      const emailsByProject: Record<string, number> = {};

      (companiesResult.data ?? []).forEach((c) => {
        companiesByProject[c.project_id] = (companiesByProject[c.project_id] || 0) + 1;
      });

      (emailsResult.data ?? []).forEach((e) => {
        emailsByProject[e.project_id] = (emailsByProject[e.project_id] || 0) + 1;
      });

      // Build stats map with score
      const statsMap: ProjectStatsMap = {};
      projectIds.forEach((id) => {
        const companiesCount = companiesByProject[id] || 0;
        const emailsCount = emailsByProject[id] || 0;
        const score = Math.min(100, companiesCount * 0.5 + emailsCount * 2);
        statsMap[id] = { companiesCount, emailsCount, score };
      });

      return statsMap;
    },
    enabled: projectIds.length > 0,
    staleTime: 30000,
  });
};
