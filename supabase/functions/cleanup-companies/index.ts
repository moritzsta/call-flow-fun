import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CleanupOptions {
  no_website: boolean;
  no_email: boolean;
  no_analysis: boolean;
  no_phone: boolean;
  chains: boolean;
  by_status: string | null; // e.g., 'rejected'
}

interface Company {
  id: string;
  company: string;
  city: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  analysis: unknown | null;
  status: string;
  created_at: string;
}

interface ChainGroup {
  baseName: string;
  count: number;
  idsToDelete: string[];
}

// Suffixes to remove when extracting base name
const LEGAL_SUFFIXES = [
  'gmbh', 'ag', 'e.k.', 'e.k', 'ek', 'kg', 'ohg', 'gbr', 'ug', 
  'mbh', 'co.', 'co', 'inc', 'ltd', 'limited', 'corp', 'corporation',
  '& co', '& co.', 'gesellschaft', 'holding', 'gruppe', 'group'
];

/**
 * Extract the base name of a company by removing city and legal suffixes
 */
function extractBaseName(companyName: string, city: string | null): string {
  let name = companyName.toLowerCase().trim();
  
  // Remove city name if present
  if (city) {
    const cityLower = city.toLowerCase();
    // Try to remove city with various patterns
    name = name.replace(new RegExp(`\\s+${cityLower}\\s*$`, 'i'), '');
    name = name.replace(new RegExp(`\\s+in\\s+${cityLower}\\s*$`, 'i'), '');
    name = name.replace(new RegExp(`\\s+-\\s+${cityLower}\\s*$`, 'i'), '');
    name = name.replace(new RegExp(`\\s+${cityLower}\\s+`, 'i'), ' ');
  }
  
  // Remove legal suffixes
  for (const suffix of LEGAL_SUFFIXES) {
    const regex = new RegExp(`\\s+${suffix.replace('.', '\\.')}\\s*$`, 'i');
    name = name.replace(regex, '');
  }
  
  // Normalize whitespace and trim
  name = name.replace(/\s+/g, ' ').trim();
  
  return name;
}

/**
 * Detect chain companies and return groups with IDs to delete
 */
function detectChains(companies: Company[]): { groups: ChainGroup[]; totalToDelete: number } {
  const baseNameMap = new Map<string, Company[]>();
  
  // Group companies by base name
  for (const company of companies) {
    const baseName = extractBaseName(company.company, company.city);
    if (baseName.length < 2) continue; // Skip very short names
    
    if (!baseNameMap.has(baseName)) {
      baseNameMap.set(baseName, []);
    }
    baseNameMap.get(baseName)!.push(company);
  }
  
  const groups: ChainGroup[] = [];
  let totalToDelete = 0;
  
  // Find groups with more than one company
  for (const [baseName, groupCompanies] of baseNameMap) {
    if (groupCompanies.length > 1) {
      // Sort by created_at (oldest first) and then by data completeness
      const sorted = groupCompanies.sort((a, b) => {
        // Prioritize companies with more data
        const scoreA = (a.website ? 1 : 0) + (a.email ? 1 : 0) + (a.phone ? 1 : 0) + (a.analysis ? 1 : 0);
        const scoreB = (b.website ? 1 : 0) + (b.email ? 1 : 0) + (b.phone ? 1 : 0) + (b.analysis ? 1 : 0);
        
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Higher score first
        }
        
        // If same score, keep oldest
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      // Keep the first one, delete the rest
      const idsToDelete = sorted.slice(1).map(c => c.id);
      
      groups.push({
        baseName: baseName.charAt(0).toUpperCase() + baseName.slice(1), // Capitalize
        count: groupCompanies.length,
        idsToDelete,
      });
      
      totalToDelete += idsToDelete.length;
    }
  }
  
  // Sort groups by count (largest first)
  groups.sort((a, b) => b.count - a.count);
  
  return { groups, totalToDelete };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { project_id, options, mode } = await req.json() as {
      project_id: string;
      options: CleanupOptions;
      mode: 'preview' | 'delete';
    };

    console.log(`[cleanup-companies] Mode: ${mode}, Project: ${project_id}`);
    console.log(`[cleanup-companies] Options:`, options);

    if (!project_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all companies for this project
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, company, city, website, email, phone, analysis, status, created_at')
      .eq('project_id', project_id);

    if (fetchError) {
      console.error('[cleanup-companies] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[cleanup-companies] Found ${companies?.length || 0} companies`);

    const allCompanies = companies as Company[] || [];
    const idsToDelete = new Set<string>();
    
    const results: {
      no_website: { count: number; ids: string[] };
      no_email: { count: number; ids: string[] };
      no_analysis: { count: number; ids: string[] };
      no_phone: { count: number; ids: string[] };
      chains: { count: number; groups: ChainGroup[] };
      by_status: { status: string; count: number; ids: string[] }[];
    } = {
      no_website: { count: 0, ids: [] },
      no_email: { count: 0, ids: [] },
      no_analysis: { count: 0, ids: [] },
      no_phone: { count: 0, ids: [] },
      chains: { count: 0, groups: [] },
      by_status: [],
    };

    // Process each option
    if (options.no_website) {
      const matching = allCompanies.filter(c => !c.website || c.website.trim() === '');
      results.no_website = { count: matching.length, ids: matching.map(c => c.id) };
      matching.forEach(c => idsToDelete.add(c.id));
    }

    if (options.no_email) {
      const matching = allCompanies.filter(c => !c.email || c.email.trim() === '');
      results.no_email = { count: matching.length, ids: matching.map(c => c.id) };
      matching.forEach(c => idsToDelete.add(c.id));
    }

    if (options.no_analysis) {
      const matching = allCompanies.filter(c => !c.analysis);
      results.no_analysis = { count: matching.length, ids: matching.map(c => c.id) };
      matching.forEach(c => idsToDelete.add(c.id));
    }

    if (options.no_phone) {
      const matching = allCompanies.filter(c => !c.phone || c.phone.trim() === '');
      results.no_phone = { count: matching.length, ids: matching.map(c => c.id) };
      matching.forEach(c => idsToDelete.add(c.id));
    }

    if (options.chains) {
      const chainResult = detectChains(allCompanies);
      results.chains = { count: chainResult.totalToDelete, groups: chainResult.groups };
      chainResult.groups.forEach(g => g.idsToDelete.forEach(id => idsToDelete.add(id)));
    }

    if (options.by_status) {
      const matching = allCompanies.filter(c => c.status === options.by_status);
      results.by_status = [{ 
        status: options.by_status, 
        count: matching.length, 
        ids: matching.map(c => c.id) 
      }];
      matching.forEach(c => idsToDelete.add(c.id));
    }

    const totalAffected = idsToDelete.size;
    console.log(`[cleanup-companies] Total affected: ${totalAffected}`);

    // If delete mode, actually delete the companies
    if (mode === 'delete' && totalAffected > 0) {
      const idsArray = Array.from(idsToDelete);
      
      // Delete in batches of 100 to avoid query limits
      const batchSize = 100;
      let deletedCount = 0;
      
      for (let i = 0; i < idsArray.length; i += batchSize) {
        const batch = idsArray.slice(i, i + batchSize);
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`[cleanup-companies] Delete batch error:`, deleteError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: deleteError.message,
              deleted_so_far: deletedCount 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        deletedCount += batch.length;
        console.log(`[cleanup-companies] Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} companies`);
      }
      
      console.log(`[cleanup-companies] Successfully deleted ${deletedCount} companies`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        results,
        total_affected: totalAffected,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cleanup-companies] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
