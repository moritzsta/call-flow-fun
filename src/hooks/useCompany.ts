import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Company } from './useCompanies';

export const useCompany = (companyId?: string) => {
  const queryClient = useQueryClient();

  const { data: company, isLoading, error, refetch } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!companyId,
  });

  const updateCompanyStatus = useMutation({
    mutationFn: async ({
      companyId,
      status,
    }: {
      companyId: string;
      status: Company['status'];
    }) => {
      const { error } = await supabase
        .from('companies')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Status aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  return {
    company,
    isLoading,
    error,
    refetch,
    updateCompanyStatus: (status: Company['status']) =>
      updateCompanyStatus.mutate({ companyId: companyId!, status }),
  };
};
