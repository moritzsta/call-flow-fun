import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface City {
  id: number;
  city: string;
  state: string;
}

export const useCitySearch = (searchTerm: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['cities-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('german_cities')
        .select('id, city, state')
        .or(`city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%`)
        .order('city')
        .limit(50);

      if (error) throw error;
      return data as City[];
    },
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
  });
};
