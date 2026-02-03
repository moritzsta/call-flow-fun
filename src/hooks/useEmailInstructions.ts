import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailInstruction {
  id: string;
  name: string;
  instruction: string;
  created_at: string;
  updated_at: string;
}

export function useEmailInstructions() {
  const queryClient = useQueryClient();

  const { data: instructions = [], isLoading, error } = useQuery({
    queryKey: ['email-instructions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_instructions')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as EmailInstruction[];
    },
  });

  const createInstruction = useMutation({
    mutationFn: async (newInstruction: { name: string; instruction: string }) => {
      const { data, error } = await supabase
        .from('email_instructions')
        .insert(newInstruction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-instructions'] });
      toast.success('E-Mail-Anweisung erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateInstruction = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; instruction?: string }) => {
      const { data, error } = await supabase
        .from('email_instructions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-instructions'] });
      toast.success('E-Mail-Anweisung aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteInstruction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-instructions'] });
      toast.success('E-Mail-Anweisung gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  return {
    instructions,
    isLoading,
    error,
    createInstruction,
    updateInstruction,
    deleteInstruction,
  };
}
