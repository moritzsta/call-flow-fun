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
}

export const useEmails = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading, error, refetch } = useQuery({
    queryKey: ['project_emails', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_emails')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectEmail[];
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
      queryClient.invalidateQueries({ queryKey: ['project_emails', projectId] });
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren des Status', {
        description: error.message,
      });
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
  };
};
