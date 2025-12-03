import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemoveDuplicatesRequest {
  project_id: string;
}

interface DuplicateRemovalResult {
  success: boolean;
  deleted_count: number;
  details: {
    by_phone: number;
    by_email: number;
    by_website: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RemoveDuplicatesRequest = await req.json();
    console.log('remove-duplicate-companies called with:', body);

    if (!body.project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing project_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await removeDuplicateCompanies(supabase, body.project_id);

    console.log('Duplicate removal result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in remove-duplicate-companies:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function removeDuplicateCompanies(
  supabase: any, 
  projectId: string
): Promise<DuplicateRemovalResult> {
  const details = {
    by_phone: 0,
    by_email: 0,
    by_website: 0,
  };

  // Process each field in order: phone → email → website
  // Important: We need to track already deleted IDs to avoid double-counting
  const deletedIds = new Set<string>();

  for (const field of ['phone', 'email', 'website'] as const) {
    console.log(`Processing duplicates by ${field}...`);
    
    // Fetch all companies with non-empty value for this field
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, created_at, ' + field)
      .eq('project_id', projectId)
      .not(field, 'is', null)
      .neq(field, '')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching companies for ${field}:`, error);
      continue;
    }

    if (!companies || companies.length === 0) {
      console.log(`No companies with ${field} found`);
      continue;
    }

    console.log(`Found ${companies.length} companies with ${field}`);

    // Group by field value (case-insensitive, trimmed)
    const groups = new Map<string, string[]>();
    
    for (const company of companies) {
      // Skip if already marked for deletion
      if (deletedIds.has(company.id)) {
        continue;
      }

      const value = company[field]?.toString().toLowerCase().trim();
      if (!value) continue;

      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value)!.push(company.id);
    }

    // Collect IDs to delete (all except first/oldest in each group)
    const idsToDelete: string[] = [];
    
    for (const [value, ids] of groups) {
      if (ids.length > 1) {
        // First ID is the oldest (due to order by created_at ASC), keep it
        const duplicates = ids.slice(1);
        idsToDelete.push(...duplicates);
        console.log(`Found ${ids.length} duplicates for ${field}="${value}", keeping oldest, deleting ${duplicates.length}`);
      }
    }

    if (idsToDelete.length > 0) {
      // Delete in batches of 100 to avoid query size limits
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const batch = idsToDelete.slice(i, i + 100);
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`Error deleting duplicates by ${field}:`, deleteError);
        } else {
          // Mark as deleted so we don't try to delete again
          batch.forEach(id => deletedIds.add(id));
        }
      }

      const fieldKey = `by_${field}` as keyof typeof details;
      details[fieldKey] = idsToDelete.length;
      console.log(`Deleted ${idsToDelete.length} duplicates by ${field}`);
    }
  }

  const totalDeleted = details.by_phone + details.by_email + details.by_website;
  
  return {
    success: true,
    deleted_count: totalDeleted,
    details,
  };
}
