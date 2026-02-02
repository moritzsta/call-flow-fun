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
  by_status: string | null;
  fix_names: boolean;
}

// HTML entities to fix in company names
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#38;': '&',
  '&#60;': '<',
  '&#62;': '>',
  '&#34;': '"',
};

/**
 * Fix HTML entities in a string
 */
function fixHtmlEntities(str: string): string {
  let result = str;
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }
  // Also handle numeric entities like &#123;
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  return result;
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
  companies: string[]; // For debugging
}

// Suffixes to remove when extracting base name
const LEGAL_SUFFIXES = [
  'gmbh & co. kg', 'gmbh & co kg', 'gmbh &co. kg', 'gmbh', 'ag', 'e.k.', 'e.k', 'ek', 
  'kg', 'ohg', 'gbr', 'ug', 'mbh', 'co.', 'co', 'inc', 'ltd', 'limited', 
  'corp', 'corporation', '& co', '& co.', 'gesellschaft', 'holding', 
  'gruppe', 'group'
];

// Common descriptive words to remove
const DESCRIPTIVE_WORDS = [
  'fitness', 'fitnessstudio', 'fitnesscenter', 'studio', 'center', 'zentrum',
  'sport', 'sports', 'training', 'gym', 'club', 'wellness', 'health',
  'frauen', 'damen', 'herren', 'premium', 'personal', 'für', 'f.',
];

/**
 * Normalize a string for comparison
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\säöüß]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract the brand/chain name from a company name
 * This extracts the first 1-3 significant words that likely represent the brand
 */
function extractBrandName(companyName: string, city: string | null): string {
  let name = normalize(companyName);
  
  // Remove city name and common city prefixes/suffixes
  if (city) {
    const cityNorm = normalize(city);
    // Also extract just the city name without postal code
    const cityMatch = city.match(/\d*\s*([A-Za-zäöüß\-]+)/);
    const cityOnly = cityMatch ? normalize(cityMatch[1]) : cityNorm;
    
    name = name.replace(new RegExp(`\\b${cityNorm}\\b`, 'gi'), ' ');
    name = name.replace(new RegExp(`\\b${cityOnly}\\b`, 'gi'), ' ');
  }
  
  // Remove legal suffixes
  for (const suffix of LEGAL_SUFFIXES) {
    name = name.replace(new RegExp(`\\s*${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '');
    name = name.replace(new RegExp(`\\s*${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), ' ');
  }
  
  // Remove descriptive words
  for (const word of DESCRIPTIVE_WORDS) {
    name = name.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }
  
  // Normalize whitespace
  name = name.replace(/\s+/g, ' ').trim();
  
  // Take the first 1-3 words as the brand name
  const words = name.split(' ').filter(w => w.length > 1);
  
  // If we have words, take up to 2 significant words
  if (words.length >= 1) {
    // For short names (1-2 words), keep all
    if (words.length <= 2) {
      return words.join(' ');
    }
    // For longer names, take first 2 words as brand
    return words.slice(0, 2).join(' ');
  }
  
  return name;
}

/**
 * Calculate similarity between two brand names
 * Returns true if they likely represent the same chain
 */
function areSameChain(brand1: string, brand2: string): boolean {
  if (!brand1 || !brand2 || brand1.length < 3 || brand2.length < 3) {
    return false;
  }
  
  // Exact match
  if (brand1 === brand2) {
    return true;
  }
  
  // One contains the other (prefix matching)
  if (brand1.startsWith(brand2) || brand2.startsWith(brand1)) {
    return true;
  }
  
  // Handle variations like "clever fit" vs "cleverfit"
  const compact1 = brand1.replace(/\s+/g, '');
  const compact2 = brand2.replace(/\s+/g, '');
  
  if (compact1 === compact2) {
    return true;
  }
  
  if (compact1.startsWith(compact2) || compact2.startsWith(compact1)) {
    // Only match if the shorter one is at least 5 chars (to avoid false positives)
    const shorter = compact1.length < compact2.length ? compact1 : compact2;
    if (shorter.length >= 5) {
      return true;
    }
  }
  
  // Handle "mrs sporty" vs "mrs. sporty" etc.
  const clean1 = brand1.replace(/[.\s]/g, '');
  const clean2 = brand2.replace(/[.\s]/g, '');
  
  if (clean1 === clean2 || clean1.startsWith(clean2) || clean2.startsWith(clean1)) {
    const shorter = clean1.length < clean2.length ? clean1 : clean2;
    if (shorter.length >= 5) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect chain companies using improved brand name extraction
 */
function detectChains(companies: Company[]): { groups: ChainGroup[]; totalToDelete: number } {
  // First, extract brand names for all companies
  const companiesWithBrands = companies.map(c => ({
    ...c,
    brandName: extractBrandName(c.company, c.city),
  }));
  
  console.log('[cleanup-companies] Sample brand extractions:');
  companiesWithBrands.slice(0, 10).forEach(c => {
    console.log(`  "${c.company}" -> "${c.brandName}"`);
  });
  
  // Group companies by similar brand names
  const groups: ChainGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < companiesWithBrands.length; i++) {
    const company = companiesWithBrands[i];
    
    if (processed.has(company.id)) continue;
    if (company.brandName.length < 3) continue;
    
    // Find all companies with similar brand names
    const chainMembers = [company];
    
    for (let j = i + 1; j < companiesWithBrands.length; j++) {
      const other = companiesWithBrands[j];
      if (processed.has(other.id)) continue;
      
      if (areSameChain(company.brandName, other.brandName)) {
        chainMembers.push(other);
      }
    }
    
    // If we found a chain (more than one company)
    if (chainMembers.length > 1) {
      // Mark all as processed
      chainMembers.forEach(m => processed.add(m.id));
      
      // Sort by data completeness and then by creation date
      const sorted = chainMembers.sort((a, b) => {
        // Prioritize companies with more data
        const scoreA = (a.website ? 2 : 0) + (a.email ? 2 : 0) + (a.phone ? 1 : 0) + (a.analysis ? 3 : 0);
        const scoreB = (b.website ? 2 : 0) + (b.email ? 2 : 0) + (b.phone ? 1 : 0) + (b.analysis ? 3 : 0);
        
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Higher score first
        }
        
        // If same score, keep oldest
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      // Keep the first one (best data), delete the rest
      const idsToDelete = sorted.slice(1).map(c => c.id);
      const displayName = company.brandName.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      
      groups.push({
        baseName: displayName,
        count: chainMembers.length,
        idsToDelete,
        companies: chainMembers.map(c => c.company),
      });
    }
  }
  
  // Sort groups by count (largest first)
  groups.sort((a, b) => b.count - a.count);
  
  const totalToDelete = groups.reduce((sum, g) => sum + g.idsToDelete.length, 0);
  
  console.log('[cleanup-companies] Detected chains:');
  groups.forEach(g => {
    console.log(`  "${g.baseName}": ${g.count} companies, deleting ${g.idsToDelete.length}`);
    console.log(`    Companies: ${g.companies.join(', ')}`);
  });
  
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
      fix_names: { count: number; fixed: { id: string; before: string; after: string }[] };
    } = {
      no_website: { count: 0, ids: [] },
      no_email: { count: 0, ids: [] },
      no_analysis: { count: 0, ids: [] },
      no_phone: { count: 0, ids: [] },
      chains: { count: 0, groups: [] },
      by_status: [],
      fix_names: { count: 0, fixed: [] },
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

    // Process fix_names option (find companies with HTML entities)
    if (options.fix_names) {
      const companiesWithEntities = allCompanies.filter(c => {
        // Check if company name contains any HTML entities
        for (const entity of Object.keys(HTML_ENTITIES)) {
          if (c.company.includes(entity)) return true;
        }
        // Also check for numeric entities
        if (/&#\d+;/.test(c.company)) return true;
        return false;
      });

      const fixedList = companiesWithEntities.map(c => ({
        id: c.id,
        before: c.company,
        after: fixHtmlEntities(c.company),
      }));

      results.fix_names = { count: fixedList.length, fixed: fixedList };
      console.log(`[cleanup-companies] Found ${fixedList.length} companies with HTML entities to fix`);
    }

    const totalAffected = idsToDelete.size;
    console.log(`[cleanup-companies] Total affected (for deletion): ${totalAffected}`);

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

    // If delete mode and fix_names is enabled, update the company names
    if (mode === 'delete' && options.fix_names && results.fix_names.fixed.length > 0) {
      console.log(`[cleanup-companies] Fixing ${results.fix_names.fixed.length} company names...`);
      
      for (const fix of results.fix_names.fixed) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({ company: fix.after, updated_at: new Date().toISOString() })
          .eq('id', fix.id);
        
        if (updateError) {
          console.error(`[cleanup-companies] Error fixing company ${fix.id}:`, updateError);
        } else {
          console.log(`[cleanup-companies] Fixed: "${fix.before}" -> "${fix.after}"`);
        }
      }
      
      console.log(`[cleanup-companies] Successfully fixed ${results.fix_names.fixed.length} company names`);
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
