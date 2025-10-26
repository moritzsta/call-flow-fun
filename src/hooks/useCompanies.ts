import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Company {
  id: string;
  project_id: string;
  company: string;
  industry: string | null;
  ceo_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  district: string | null;
  status: 'found' | 'analyzed' | 'contacted' | 'rejected';
  analysis: any | null;
  created_at: string;
  updated_at: string;
}

export const useCompanies = (projectId?: string) => {
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Company[];
    },
    enabled: !!projectId,
  });

  return {
    companies,
    isLoading,
    error,
  };
};
