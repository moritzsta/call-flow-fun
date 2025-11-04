import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyCompanyDeleted, 
  notifyCompanyStatusUpdated,
  notifyCrudError 
} from '@/lib/notifications';

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
  hasWebsite?: boolean;
  hasEmail?: boolean;
  isAnalyzed?: boolean;
}

export interface CompanySortConfig {
  field: 'company' | 'status' | 'created_at' | 'industry' | 'city';
  ascending: boolean;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export const useCompanies = (
  projectId?: string,
  filters?: CompanyFilters,
  sortConfig?: CompanySortConfig,
  pagination?: PaginationConfig
) => {
  const queryClient = useQueryClient();
  const defaultPagination = { page: 0, pageSize: 50 };

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['companies', projectId, filters, sortConfig, pagination],
    queryFn: async () => {
      if (!projectId) return { data: [], count: 0 };

      const paginationConfig = pagination || defaultPagination;
      const from = paginationConfig.page * paginationConfig.pageSize;
      const to = from + paginationConfig.pageSize - 1;

      // Select only needed fields for better performance
      let query = supabase
        .from('companies')
        .select('id, project_id, company, industry, ceo_name, email, phone, website, address, city, state, district, status, analysis, created_at, updated_at', { count: 'exact' })
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
          `company.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,ceo_name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,city.ilike.%${filters.search}%,state.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
        );
      }
      if (filters?.hasWebsite) {
        query = query.not('website', 'is', null);
      }
      if (filters?.hasEmail) {
        query = query.not('email', 'is', null);
      }
      if (filters?.isAnalyzed) {
        query = query.not('analysis', 'is', null);
      }

      // Apply sorting
      if (sortConfig) {
        query = query.order(sortConfig.field, { ascending: sortConfig.ascending });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as Company[], count: count || 0 };
    },
    enabled: !!projectId,
  });

  const companies = result?.data || [];
  const totalCount = result?.count || 0;

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
      notifyCompanyDeleted();
    },
    onError: (error: Error) => {
      notifyCrudError('Löschen', error.message);
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
      notifyCompanyStatusUpdated();
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
    },
  });

  return {
    companies,
    totalCount,
    isLoading,
    error,
    refetch,
    deleteCompany: deleteCompany.mutate,
    updateCompanyStatus: (companyId: string, status: Company['status']) =>
      updateCompanyStatus.mutate({ companyId, status }),
  };
};
