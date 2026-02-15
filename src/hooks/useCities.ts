import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface City {
  id: number;
  city: string;
  state: string;
}

export const useCities = () => {
  return useQuery({
    queryKey: ['german-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('german_cities')
        .select('id, city, state')
        .order('city');

      if (error) throw error;
      return data as City[];
    },
    staleTime: Infinity, // Cities don't change often
  });
};
