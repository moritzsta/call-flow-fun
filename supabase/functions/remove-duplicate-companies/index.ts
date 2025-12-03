import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemoveDuplicatesRequest {
  project_id: string;
  type?: 'companies' | 'emails' | 'both';  // Default: 'companies' for backwards compatibility
}

interface CompanyDuplicateDetails {
  by_phone: number;
  by_email: number;
  by_website: number;
}

interface EmailDuplicateDetails {
  by_recipient_email: number;
}

interface DuplicateRemovalResult {
  success: boolean;
  deleted_count: number;
  companies?: CompanyDuplicateDetails;
  emails?: EmailDuplicateDetails;
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

    const type = body.type || 'companies';
    let result: DuplicateRemovalResult;

    if (type === 'companies') {
      result = await removeDuplicateCompanies(supabase, body.project_id);
    } else if (type === 'emails') {
      result = await removeDuplicateEmails(supabase, body.project_id);
    } else {
      // Both
      const companyResult = await removeDuplicateCompanies(supabase, body.project_id);
      const emailResult = await removeDuplicateEmails(supabase, body.project_id);
      result = {
        success: true,
        deleted_count: companyResult.deleted_count + emailResult.deleted_count,
        companies: companyResult.companies,
        emails: emailResult.emails,
      };
    }

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
  const details: CompanyDuplicateDetails = {
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
    companies: details,
  };
}

async function removeDuplicateEmails(
  supabase: any,
  projectId: string
): Promise<DuplicateRemovalResult> {
  console.log('Processing duplicate emails for project:', projectId);

  // Fetch all emails with non-empty recipient_email
  const { data: emails, error } = await supabase
    .from('project_emails')
    .select('id, created_at, recipient_email')
    .eq('project_id', projectId)
    .not('recipient_email', 'is', null)
    .neq('recipient_email', '')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching emails:', error);
    return {
      success: false,
      deleted_count: 0,
      emails: { by_recipient_email: 0 },
    };
  }

  if (!emails || emails.length === 0) {
    console.log('No emails found');
    return {
      success: true,
      deleted_count: 0,
      emails: { by_recipient_email: 0 },
    };
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

  return {
    success: true,
    deleted_count: idsToDelete.length,
    emails: { by_recipient_email: idsToDelete.length },
  };
}
