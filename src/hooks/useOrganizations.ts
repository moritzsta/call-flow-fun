import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyOrganizationCreated,
  notifyOrganizationUpdated,
  notifyOrganizationDeleted,
  notifyCrudError 
} from '@/lib/notifications';

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}

export const useOrganizations = () => {
  const queryClient = useQueryClient();

  // Fetch all organizations where user is a member
  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Organization[];
    },
  });

  // Create organization
  const createOrganization = useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: input.name,
          description: input.description || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as member with 'owner' role
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: data.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      notifyOrganizationCreated();
    },
    onError: (error: Error) => {
      notifyCrudError('Erstellen', error.message);
    },
  });

  // Update organization
  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      notifyOrganizationUpdated();
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
    },
  });

  // Delete organization
  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      notifyOrganizationDeleted();
    },
    onError: (error: Error) => {
      notifyCrudError('Löschen', error.message);
    },
  });

  return {
    organizations,
    isLoading,
    error,
    createOrganization: createOrganization.mutate,
    updateOrganization: updateOrganization.mutate,
    deleteOrganization: deleteOrganization.mutate,
    isCreating: createOrganization.isPending,
    isUpdating: updateOrganization.isPending,
    isDeleting: deleteOrganization.isPending,
  };
};
