import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyMemberAdded,
  notifyMemberRemoved,
  notifyRoleUpdated,
  notifyCrudError 
} from '@/lib/notifications';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'read_only';
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface InviteMemberInput {
  organization_id: string;
  email: string;
  role: 'owner' | 'manager' | 'read_only';
}

export const useOrganizationMembers = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch all members for an organization
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at');

      if (membersError) throw membersError;

      // Fetch profiles for all user_ids
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Merge members with profiles
      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profiles: profilesData.find(p => p.id === member.user_id) || null,
      }));

      return membersWithProfiles as OrganizationMember[];
    },
    enabled: !!organizationId,
  });

  // Invite member (insert member record)
  const inviteMember = useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      // First, check if user exists by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profiles) {
        throw new Error('Benutzer mit dieser E-Mail existiert nicht');
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', input.organization_id)
        .eq('user_id', profiles.id)
        .maybeSingle();

      if (existing) {
        throw new Error('Benutzer ist bereits Mitglied dieser Organisation');
      }

      // Insert member
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: input.organization_id,
          user_id: profiles.id,
          role: input.role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      notifyMemberAdded();
    },
    onError: (error: Error) => {
      notifyCrudError('Hinzufügen des Mitglieds', error.message);
    },
  });

  // Update member role
  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'owner' | 'manager' | 'read_only' }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      notifyRoleUpdated();
    },
    onError: (error: Error) => {
      notifyCrudError('Aktualisieren', error.message);
    },
  });

  // Remove member
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organizationId] });
      notifyMemberRemoved();
    },
    onError: (error: Error) => {
      notifyCrudError('Entfernen', error.message);
    },
  });

  return {
    members,
    isLoading,
    error,
    inviteMember: inviteMember.mutate,
    updateMemberRole: updateMemberRole.mutate,
    removeMember: removeMember.mutate,
    isInviting: inviteMember.isPending,
    isUpdating: updateMemberRole.isPending,
    isRemoving: removeMember.isPending,
  };
};
