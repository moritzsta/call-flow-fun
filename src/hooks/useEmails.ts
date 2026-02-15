import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  notifyEmailSent, 
  notifyEmailSendError,
  notifyCrudError,
  notifyEmailDeleted 
} from '@/lib/notifications';

export interface ProjectEmail {
  id: string;
  project_id: string;
  company_id: string;
  subject: string;
  body: string;
  body_improved?: string | null;
  recipient_email: string;
  status: 'draft' | 'ready_to_send' | 'sending' | 'sent' | 'failed';
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

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export const useEmails = (
  projectId?: string,
  filters?: EmailFilters,
  sortConfig?: EmailSortConfig,
  pagination?: PaginationConfig
) => {
  const queryClient = useQueryClient();
  const defaultPagination = { page: 0, pageSize: 50 };

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['project_emails', projectId, filters, sortConfig, pagination],
    queryFn: async () => {
      if (!projectId) return { data: [], count: 0 };

      const paginationConfig = pagination || defaultPagination;
      const from = paginationConfig.page * paginationConfig.pageSize;
      const to = from + paginationConfig.pageSize - 1;

      // Select only needed fields for better performance
      let query = supabase
        .from('project_emails')
        .select(`
          id, project_id, company_id, subject, body, body_improved, recipient_email, status, sent_at, created_at, updated_at,
          companies!project_emails_company_id_fkey(company)
        `, { count: 'exact' })
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

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Flatten the company name
      const emails = (data || []).map((email: any) => ({
        ...email,
        company_name: email.companies?.company || null,
        companies: undefined,
      })) as ProjectEmail[];

      return { data: emails, count: count || 0 };
    },
    enabled: !!projectId,
  });

  const emails = result?.data || [];
  const totalCount = result?.count || 0;

  // Einzelne E-Mail versenden über sende_susan_single
  const sendEmailMutation = useMutation({
    mutationFn: async ({ 
      emailId, 
      projectId, 
      userId 
    }: { 
      emailId: string; 
      projectId: string;
      userId: string;
    }) => {
      // 1. Status sofort auf 'sending' setzen für visuelles Feedback
      await supabase
        .from('project_emails')
        .update({ status: 'sending' as any, updated_at: new Date().toISOString() })
        .eq('id', emailId);

      // 2. n8n Workflow triggern
      const { data, error } = await supabase.functions.invoke(
        'trigger-n8n-workflow',
        {
          body: {
            workflow_name: 'sende_susan_single',
            workflow_id: crypto.randomUUID(),
            project_id: projectId,
            user_id: userId,
            trigger_data: {
              email_id: emailId,
            }
          }
        }
      );

      if (error) throw new Error(`Webhook Error: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_emails', projectId] });
    },
    onError: (error: Error) => {
      notifyEmailSendError(error.message);
    }
  });

  // Batch E-Mail versenden über sende_susan
  const sendAllEmailsMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      userId 
    }: { 
      projectId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'trigger-n8n-workflow',
        {
          body: {
            workflow_name: 'sende_susan',
            workflow_id: crypto.randomUUID(),
            project_id: projectId,
            user_id: userId,
            trigger_data: {
              send_all: true
            }
          }
        }
      );

      if (error) throw new Error(`Webhook Error: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      notifyEmailSent();
      queryClient.invalidateQueries({ queryKey: ['project_emails', projectId] });
    },
    onError: (error: Error) => {
      notifyEmailSendError(error.message);
    }
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
      notifyCrudError('Aktualisieren des Status', error.message);
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
      notifyEmailDeleted();
    },
    onError: (error: Error) => {
      notifyCrudError('Löschen', error.message);
    },
  });

  // Alle E-Mails eines Projekts löschen
  const deleteAllEmailsMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error, count } = await supabase
        .from('project_emails')
        .delete()
        .eq('project_id', projectId);

      if (error) throw error;
      return { deletedCount: count || 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['project_emails'] });
      toast.success(`${result.deletedCount} E-Mails gelöscht`);
    },
    onError: (error: Error) => {
      notifyCrudError('Löschen aller E-Mails', error.message);
    },
  });

  // Alle Empfänger-E-Mails auf eine Test-Adresse aktualisieren
  const updateAllRecipientsMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      newEmail 
    }: { 
      projectId: string; 
      newEmail: string;
    }) => {
      const { data, error } = await supabase
        .from('project_emails')
        .update({ recipient_email: newEmail, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .select('id');

      if (error) throw error;
      return { updatedCount: data?.length || 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['project_emails', projectId] });
      toast.success(`${result.updatedCount} E-Mail-Adressen aktualisiert`);
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren der E-Mail-Adressen', error.message);
    },
  });

  return {
    emails,
    totalCount,
    isLoading,
    error,
    refetch,
    sendEmail: sendEmailMutation.mutate,
    isSending: sendEmailMutation.isPending,
    sendAllEmails: sendAllEmailsMutation.mutate,
    isSendingAll: sendAllEmailsMutation.isPending,
    updateEmailStatus: updateEmailStatusMutation.mutate,
    deleteEmail: deleteEmailMutation.mutate,
    deleteAllEmails: deleteAllEmailsMutation.mutate,
    isDeletingAll: deleteAllEmailsMutation.isPending,
    updateAllRecipients: updateAllRecipientsMutation.mutate,
    isUpdatingRecipients: updateAllRecipientsMutation.isPending,
  };
};