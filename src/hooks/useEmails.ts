import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectEmail {
  id: string;
  project_id: string;
  company_id: string;
  subject: string;
  body: string;
  recipient_email: string;
  status: 'draft' | 'ready_to_send' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string;
}

export interface EmailFilters {
  status?: string;
  company_name?: string;
  search?: string;
}

export interface EmailSortConfig {
  field: 'created_at' | 'sent_at' | 'status' | 'subject';
  ascending: boolean;
}

export const useEmails = (
  projectId?: string,
  filters?: EmailFilters,
  sortConfig?: EmailSortConfig
) => {
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading, error, refetch } = useQuery({
    queryKey: ['project_emails', projectId, filters, sortConfig],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from('project_emails')
        .select(`
          *,
          companies!project_emails_company_id_fkey(company)
        `)
        .eq('project_id', projectId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status as ProjectEmail['status']);
      }
      if (filters?.company_name) {
        query = query.ilike('companies.company', `%${filters.company_name}%`);
      }
      if (filters?.search) {
        query = query.or(
          `subject.ilike.%${filters.search}%,recipient_email.ilike.%${filters.search}%`
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

      // Flatten the company name
      return (data || []).map((email: any) => ({
        ...email,
        company_name: email.companies?.company || null,
        companies: undefined,
      })) as ProjectEmail[];
    },
    enabled: !!projectId,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ emailId, userId }: { emailId: string; userId: string }) => {
      // 1. Call n8n webhook via Edge Function
      const { data: webhookResponse, error: functionError } = await supabase.functions.invoke(
        'trigger-n8n-workflow',
        {
          body: {
            workflow_name: 'email_sender',
            project_email_id: emailId,
            user_id: userId,
          },
        }
      );

      if (functionError) {
        throw new Error(`Webhook Error: ${functionError.message}`);
      }

      return webhookResponse;
    },
    onSuccess: (data, variables) => {
      toast.success('E-Mail erfolgreich versendet!');
      queryClient.invalidateQueries({ queryKey: ['project_emails', projectId] });
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Versenden der E-Mail', {
        description: error.message,
      });
    },
  });

  const updateEmailStatusMutation = useMutation({
    mutationFn: async ({ 
      emailId, 
      status, 
      sentAt 
    }: { 
      emailId: string; 
      status: ProjectEmail['status']; 
      sentAt?: string 
    }) => {
      const updateData: any = { status };
      if (sentAt) {
        updateData.sent_at = sentAt;
      }

      const { error } = await supabase
        .from('project_emails')
        .update(updateData)
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_emails'] });
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren des Status', {
        description: error.message,
      });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('project_emails')
        .delete()
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_emails'] });
      toast.success('E-Mail wurde gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  return {
    emails,
    isLoading,
    error,
    refetch,
    sendEmail: sendEmailMutation.mutate,
    isSending: sendEmailMutation.isPending,
    updateEmailStatus: updateEmailStatusMutation.mutate,
    deleteEmail: deleteEmailMutation.mutate,
  };
};
