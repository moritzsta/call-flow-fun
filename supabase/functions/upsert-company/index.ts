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

    // Check for existing company (same project_id, company name, and address)
    const { data: existingCompany, error: selectError } = await supabase
      .from('companies')
      .select('*')
      .eq('project_id', companyData.project_id)
      .eq('company', companyData.company)
      .eq('address', companyData.address || '')
      .maybeSingle();

    if (selectError) {
      console.error('[upsert-company] Select error:', selectError);
      throw selectError;
    }

    let result;
    let action = 'inserted';

    if (existingCompany) {
      // Update existing company with merge logic (keep existing data if new data is null)
      console.log(`[upsert-company] Found duplicate, updating: ${existingCompany.id}`);
      
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          email: companyData.email || existingCompany.email,
          phone: companyData.phone || existingCompany.phone,
          website: companyData.website || existingCompany.website,
          industry: companyData.industry || existingCompany.industry,
          ceo_name: companyData.ceo_name || existingCompany.ceo_name,
          city: companyData.city || existingCompany.city,
          state: companyData.state || existingCompany.state,
          district: companyData.district || existingCompany.district,
          analysis: companyData.analysis || existingCompany.analysis,
          status: companyData.status || existingCompany.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCompany.id)
        .select()
        .single();

      if (updateError) {
        console.error('[upsert-company] Update error:', updateError);
        throw updateError;
      }

      result = updatedCompany;
      action = 'updated';
    } else {
      // Insert new company
      console.log(`[upsert-company] No duplicate found, inserting new company`);
      
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          status: companyData.status || 'found'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[upsert-company] Insert error:', insertError);
        throw insertError;
      }

      result = newCompany;
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

