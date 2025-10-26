import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  organization_id: string;
  title: string;
  description?: string;
}

export const useProjects = (organizationId?: string) => {
  const queryClient = useQueryClient();

  // Fetch all projects for an organization
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!organizationId,
  });

  // Create project
  const createProject = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id: input.organization_id,
          title: input.title,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.organization_id] });
      toast.success('Projekt erfolgreich erstellt!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });

  // Update project
  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.organization_id] });
      toast.success('Projekt aktualisiert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  // Archive project
  const archiveProject = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.organization_id] });
      toast.success('Projekt archiviert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Archivieren: ${error.message}`);
    },
  });

  // Delete project
  const deleteProject = useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return organizationId;
    },
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
      toast.success('Projekt gelöscht!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    archiveProject: archiveProject.mutate,
    deleteProject: deleteProject.mutate,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isArchiving: archiveProject.isPending,
    isDeleting: deleteProject.isPending,
  };
};
