import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
      status,
    }: {
      emailId: string;
      subject: string;
      body: string;
      status?: ProjectEmail['status'];
    }) => {
      const updateData: any = { subject, body, updated_at: new Date().toISOString() };
      if (status) {
        updateData.status = status;
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
      toast.success('E-Mail gespeichert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Speichern: ${error.message}`);
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
      toast.success('Status aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  return {
    email,
    isLoading,
    error,
    refetch,
    updateEmail: (subject: string, body: string, status?: ProjectEmail['status']) =>
      updateEmailMutation.mutate({ emailId: emailId!, subject, body, status }),
    updateStatus: (status: ProjectEmail['status']) =>
      updateStatusMutation.mutate({ emailId: emailId!, status }),
    isUpdating: updateEmailMutation.isPending || updateStatusMutation.isPending,
  };
};
