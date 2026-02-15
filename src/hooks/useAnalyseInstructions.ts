import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface AnalyseInstruction {
  id: string;
  name: string;
  instruction: string;
  created_at: string;
  updated_at: string;
}

export function useAnalyseInstructions() {
  const queryClient = useQueryClient();

  const { data: instructions = [], isLoading, error } = useQuery({
    queryKey: ['analyse-instructions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyse_instructions')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as AnalyseInstruction[];
    },
  });

  const createInstruction = useMutation({
    mutationFn: async (newInstruction: { name: string; instruction: string }) => {
      const { data, error } = await supabase
        .from('analyse_instructions')
        .insert(newInstruction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyse-instructions'] });
      toast.success('Analyse-Anweisung erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateInstruction = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; instruction?: string }) => {
      const { data, error } = await supabase
        .from('analyse_instructions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyse-instructions'] });
      toast.success('Analyse-Anweisung aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteInstruction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analyse_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyse-instructions'] });
      toast.success('Analyse-Anweisung gelöscht');
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
