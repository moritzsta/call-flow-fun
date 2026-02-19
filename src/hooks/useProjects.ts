import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyProjectCreated,
  notifyProjectUpdated,
  notifyProjectArchived,
  notifyProjectDeleted,
  notifyCrudError 
} from '@/lib/notifications';

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

  // Fetch projects - wenn organizationId angegeben, nur für diese Org
  // Wenn nicht angegeben, lade ALLE Projekte des Users
  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: organizationId ? ['projects', organizationId] : ['projects', 'all'],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Project[];
    },
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
      notifyProjectCreated();
    },
    onError: (error: Error) => {
      notifyCrudError('Erstellen', error.message);
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
      notifyProjectUpdated();
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
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
      notifyProjectArchived();
    },
    onError: (error: Error) => {
      notifyCrudError('Archivieren', error.message);
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
      notifyProjectDeleted();
    },
    onError: (error: Error) => {
      notifyCrudError('Löschen', error.message);
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
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
