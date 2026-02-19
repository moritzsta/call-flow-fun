import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  enum_name: string;
  title: string;
  subject_template: string;
  body_template: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateInsert {
  enum_name?: string;
  title: string;
  subject_template: string;
  body_template: string;
}

export const useEmailTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch all templates (no longer organization-specific)
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['email_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }

      return data as EmailTemplate[];
    },
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async (template: EmailTemplateInsert) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('Template erfolgreich erstellt');
    },
    onError: (error: Error) => {
      console.error('Error creating template:', error);
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('Template erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      console.error('Error updating template:', error);
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('Template erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      console.error('Error deleting template:', error);
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
  };
};
