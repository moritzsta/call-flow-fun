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
    console.log('remove-duplicate-emails called with:', body);

    if (!body.project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing project_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all emails with non-empty recipient_email
    const { data: emails, error } = await supabase
      .from('project_emails')
      .select('id, created_at, recipient_email')
      .eq('project_id', body.project_id)
      .not('recipient_email', 'is', null)
      .neq('recipient_email', '')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching emails:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, deleted_count: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!emails || emails.length === 0) {
      console.log('No emails found');
      return new Response(
        JSON.stringify({ success: true, deleted_count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${emails.length} emails`);

    // Group by recipient_email (case-insensitive, trimmed)
    const groups = new Map<string, string[]>();

    for (const email of emails) {
      const value = email.recipient_email?.toString().toLowerCase().trim();
      if (!value) continue;

      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value)!.push(email.id);
    }

    // Collect IDs to delete (all except first/oldest in each group)
    const idsToDelete: string[] = [];

    for (const [value, ids] of groups) {
      if (ids.length > 1) {
        const duplicates = ids.slice(1);
        idsToDelete.push(...duplicates);
        console.log(`Found ${ids.length} duplicates for recipient_email="${value}", keeping oldest, deleting ${duplicates.length}`);
      }
    }

    if (idsToDelete.length > 0) {
      // Delete in batches of 100
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const batch = idsToDelete.slice(i, i + 100);
        const { error: deleteError } = await supabase
          .from('project_emails')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error('Error deleting duplicate emails:', deleteError);
        }
      }
      console.log(`Deleted ${idsToDelete.length} duplicate emails`);
    }

    const result: DuplicateRemovalResult = {
      success: true,
      deleted_count: idsToDelete.length,
    };

    console.log('Duplicate removal result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in remove-duplicate-emails:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        deleted_count: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
