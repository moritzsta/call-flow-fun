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
    
    console.log(`[upsert-company] Processing company: ${companyData.company} with phone: ${companyData.phone || 'no phone'}`);

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Normalize phone (treat null as empty string for comparison)
    const normalizedPhone = companyData.phone || '';

    // Manual check: Does company already exist based on (project_id, company, phone)?
    // We need this because Supabase's upsert doesn't support functional indexes (COALESCE)
    const { data: existing, error: checkError } = await supabase
      .from('companies')
      .select('id, created_at')
      .eq('project_id', companyData.project_id)
      .eq('company', companyData.company)
      .or(normalizedPhone ? `phone.is.null,phone.eq.${normalizedPhone}` : 'phone.is.null')
      .maybeSingle();

    if (checkError) {
      console.error('[upsert-company] Check error:', checkError);
      throw checkError;
    }

    let result;
    let action: 'inserted' | 'updated';

    if (existing) {
      // UPDATE: Company exists
      console.log(`[upsert-company] Updating existing company: ${existing.id}`);
      
      const { data: updated, error: updateError } = await supabase
        .from('companies')
        .update({
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
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[upsert-company] Update error:', updateError);
        throw updateError;
      }

      result = updated;
      action = 'updated';
    } else {
      // INSERT: New company
      console.log(`[upsert-company] Inserting new company: ${companyData.company}`);
      
      const { data: inserted, error: insertError } = await supabase
        .from('companies')
        .insert({
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
          status: companyData.status || 'found'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[upsert-company] Insert error:', insertError);
        throw insertError;
      }

      result = inserted;
      action = 'inserted';
    }

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

