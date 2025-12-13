import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Workflow Watchdog - Server-side cron job for timeout detection
 * 
 * Purpose: Mark workflows as 'failed' if they have been inactive for more than 5 minutes.
 * 
 * This watchdog handles ALL workflow types:
 * - Automated Pipeline workflows (also handled by checkAndRecoverStuckWorkflows in advance-pipeline)
 * - Standalone Auto-Modules (single batch executions)
 * - Chat workflows (also have browser-side watchdog as backup)
 * 
 * Should be triggered via pg_cron every 1-2 minutes.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[workflow-watchdog] Starting watchdog check...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoffTime = new Date(Date.now() - INACTIVITY_TIMEOUT_MS).toISOString();
    
    console.log(`[workflow-watchdog] Checking for workflows inactive since: ${cutoffTime}`);

    // Find all active workflows that have been inactive for more than 5 minutes
    const { data: stuckWorkflows, error: fetchError } = await supabase
      .from('n8n_workflow_states')
      .select('id, workflow_name, status, updated_at, project_id, pipeline_id')
      .in('status', ['running', 'alive', 'pending'])
      .lt('updated_at', cutoffTime);

    if (fetchError) {
      console.error('[workflow-watchdog] Error fetching workflows:', fetchError);
      throw fetchError;
    }

    if (!stuckWorkflows || stuckWorkflows.length === 0) {
      console.log('[workflow-watchdog] No stuck workflows found');
      return new Response(
        JSON.stringify({ 
          message: 'No stuck workflows found',
          checked_at: new Date().toISOString(),
          workflows_marked_failed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[workflow-watchdog] Found ${stuckWorkflows.length} stuck workflow(s)`);

    const results: Array<{ id: string; workflow_name: string; mode: string; success: boolean }> = [];

    for (const workflow of stuckWorkflows) {
      const mode = workflow.pipeline_id ? 'PIPELINE' : 'STANDALONE';
      console.log(`[workflow-watchdog] Marking ${workflow.workflow_name} (${workflow.id}) as failed [${mode}]`);

      const { error: updateError } = await supabase
        .from('n8n_workflow_states')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          result_summary: {
            error: 'Timeout: 5 Minuten ohne Update',
            detected_by: 'workflow-watchdog',
            mode: mode,
            last_update: workflow.updated_at
          }
        })
        .eq('id', workflow.id);

      if (updateError) {
        console.error(`[workflow-watchdog] Error updating workflow ${workflow.id}:`, updateError);
        results.push({ 
          id: workflow.id, 
          workflow_name: workflow.workflow_name, 
          mode,
          success: false 
        });
      } else {
        console.log(`[workflow-watchdog] Successfully marked ${workflow.workflow_name} as failed`);
        results.push({ 
          id: workflow.id, 
          workflow_name: workflow.workflow_name, 
          mode,
          success: true 
        });

        // For pipeline workflows, the advance-pipeline will handle recovery on next call
        // For standalone workflows, just marking as failed is sufficient
        if (workflow.pipeline_id) {
          console.log(`[workflow-watchdog] Pipeline workflow - advance-pipeline will handle recovery`);
        } else {
          console.log(`[workflow-watchdog] Standalone workflow - no further action needed`);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: `Marked ${successCount} workflow(s) as failed`,
        checked_at: new Date().toISOString(),
        workflows_marked_failed: successCount,
        details: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[workflow-watchdog] Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'Watchdog check failed', 
        details: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
