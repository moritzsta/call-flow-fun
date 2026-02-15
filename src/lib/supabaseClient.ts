import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = 'https://xoe8312g4177ugoq.myfritz.net';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcxMDIzNjAwLCJleHAiOjE5Mjg3OTAwMDB9.neOsV2JiSdmRluC1L5xzJ-XYNZqolObfB7TAo5H_S60';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'projekt_b' as any },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
