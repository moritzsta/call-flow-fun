import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  project_id: string;
  company: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  industry?: string;
  ceo_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  analysis?: any;
  status?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const companyData: CompanyData = await req.json();
    
    console.log(`[upsert-company] Processing company: ${companyData.company} at ${companyData.address || 'no address'}`);

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Use native upsert with onConflict for (project_id, company, address)
    // This is more efficient and robust than manual checking
    const { data: result, error: upsertError } = await supabase
      .from('companies')
      .upsert(
        {
          project_id: companyData.project_id,
          company: companyData.company,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          district: companyData.district,
          industry: companyData.industry,
          ceo_name: companyData.ceo_name,
          phone: companyData.phone,
          email: companyData.email,
          website: companyData.website,
          analysis: companyData.analysis,
          status: companyData.status || 'found',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'project_id,company,address',
          ignoreDuplicates: false // Update on conflict
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[upsert-company] Upsert error:', upsertError);
      throw upsertError;
    }

    // Determine if it was an insert or update by checking timestamps
    const action = result.created_at === result.updated_at ? 'inserted' : 'updated';
    console.log(`[upsert-company] Successfully ${action} company: ${result.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        company: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[upsert-company] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

