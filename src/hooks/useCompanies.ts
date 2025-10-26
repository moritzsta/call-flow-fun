import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface CompanyFilters {
  status?: string;
  industry?: string;
  city?: string;
  state?: string;
  search?: string;
}

export interface CompanySortConfig {
  field: 'company' | 'status' | 'created_at' | 'industry' | 'city';
  ascending: boolean;
}

export const useCompanies = (
  projectId?: string,
  filters?: CompanyFilters,
  sortConfig?: CompanySortConfig
) => {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading, error, refetch } = useQuery({
    queryKey: ['companies', projectId, filters, sortConfig],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from('companies')
        .select('*')
        .eq('project_id', projectId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status as Company['status']);
      }
      if (filters?.industry) {
        query = query.ilike('industry', `%${filters.industry}%`);
      }
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      if (filters?.search) {
        query = query.or(
          `company.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      if (sortConfig) {
        query = query.order(sortConfig.field, { ascending: sortConfig.ascending });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Company[];
    },
    enabled: !!projectId,
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', projectId] });
      toast.success('Firma wurde gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  // Update company status mutation
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
      queryClient.invalidateQueries({ queryKey: ['companies', projectId] });
      toast.success('Status aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  return {
    companies,
    isLoading,
    error,
    refetch,
    deleteCompany: deleteCompany.mutate,
    updateCompanyStatus: (companyId: string, status: Company['status']) =>
      updateCompanyStatus.mutate({ companyId, status }),
  };
};
