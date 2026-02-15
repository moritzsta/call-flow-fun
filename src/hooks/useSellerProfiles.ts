import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface SellerProfile {
  id: string;
  profile_name: string;
  name: string;
  company: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export function useSellerProfiles() {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['seller-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .order('profile_name');

      if (error) throw error;
      return data as SellerProfile[];
    },
  });

  const createProfile = useMutation({
    mutationFn: async (newProfile: { 
      profile_name: string; 
      name: string; 
      company: string;
      address?: string;
      phone?: string;
      website?: string;
    }) => {
      const { data, error } = await supabase
        .from('seller_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profiles'] });
      toast.success('Verkäufer-Profil erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      profile_name?: string; 
      name?: string; 
      company?: string;
      address?: string | null;
      phone?: string | null;
      website?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('seller_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profiles'] });
      toast.success('Verkäufer-Profil aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seller_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profiles'] });
      toast.success('Verkäufer-Profil gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  return {
    profiles,
    isLoading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
