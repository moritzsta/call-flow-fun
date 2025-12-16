import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyCompanyStatusUpdated,
  notifyCrudError,
  notifySuccess
} from '@/lib/notifications';
import { Company } from './useCompanies';

export interface CompanyUpdateData {
  company?: string;
  industry?: string;
  ceo_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
}

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
      notifyCompanyStatusUpdated();
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({
      companyId,
      data,
    }: {
      companyId: string;
      data: CompanyUpdateData;
    }) => {
      const { error } = await supabase
        .from('companies')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      notifySuccess('Firma erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
    },
  });

  return {
    company,
    isLoading,
    error,
    refetch,
    updateCompanyStatus: (status: Company['status']) =>
      updateCompanyStatus.mutate({ companyId: companyId!, status }),
    updateCompany: (data: CompanyUpdateData) =>
      updateCompany.mutate({ companyId: companyId!, data }),
    isUpdating: updateCompany.isPending,
  };
};
