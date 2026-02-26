import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyEmailSaved, 
  notifyEmailStatusUpdated,
  notifyCrudError 
} from '@/lib/notifications';
import { ProjectEmail } from './useEmails';

export const useEmail = (emailId?: string) => {
  const queryClient = useQueryClient();

  const { data: email, isLoading, error, refetch } = useQuery({
    queryKey: ['email', emailId],
    queryFn: async () => {
      if (!emailId) return null;

      const { data, error } = await supabase
        .from('project_emails')
        .select(`
          *,
          companies!project_emails_company_id_fkey(company)
        `)
        .eq('id', emailId)
        .single();

      if (error) throw error;

      return {
        ...data,
        company_name: data.companies?.company || null,
        companies: undefined,
      } as ProjectEmail;
    },
    enabled: !!emailId,
  });

  const updateEmailMutation = useMutation({
    mutationFn: async ({
      emailId,
      subject,
      body,
      recipientEmail,
      status,
    }: {
      emailId: string;
      subject: string;
      body: string;
      recipientEmail?: string;
      status?: ProjectEmail['status'];
    }) => {
      const updateData: any = { subject, body, updated_at: new Date().toISOString() };
      if (status) {
        updateData.status = status;
      }
      if (recipientEmail) {
        updateData.recipient_email = recipientEmail;
      }

      const { error } = await supabase
        .from('project_emails')
        .update(updateData)
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', emailId] });
      queryClient.invalidateQueries({ queryKey: ['project_emails'] });
      notifyEmailSaved();
    },
    onError: (error: Error) => {
      notifyCrudError('Speichern', error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      emailId,
      status,
    }: {
      emailId: string;
      status: ProjectEmail['status'];
    }) => {
      const { error } = await supabase
        .from('project_emails')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', emailId] });
      queryClient.invalidateQueries({ queryKey: ['project_emails'] });
      notifyEmailStatusUpdated();
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
    },
  });

  const removeImprovementMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('project_emails')
        .update({ body_improved: null, updated_at: new Date().toISOString() })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', emailId] });
      queryClient.invalidateQueries({ queryKey: ['project_emails'] });
      notifyEmailSaved();
    },
    onError: (error: Error) => {
      notifyCrudError('Entfernen der Verbesserung', error.message);
    },
  });

  return {
    email,
    isLoading,
    error,
    refetch,
    updateEmail: (subject: string, body: string, recipientEmail?: string, status?: ProjectEmail['status']) =>
      updateEmailMutation.mutate({ emailId: emailId!, subject, body, recipientEmail, status }),
    updateStatus: (status: ProjectEmail['status']) =>
      updateStatusMutation.mutate({ emailId: emailId!, status }),
    removeImprovement: () => removeImprovementMutation.mutate(emailId!),
    isRemovingImprovement: removeImprovementMutation.isPending,
    isUpdating: updateEmailMutation.isPending || updateStatusMutation.isPending,
  };
};
