import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledRun {
  id: string;
  project_id: string;
  user_id: string;
  city: string;
  state: string;
  category: string;
  max_companies: number | null;
  scheduled_at: string;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[schedule-felix-runs] Starting scheduled run check...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all pending runs that are due
    const now = new Date().toISOString();
    const { data: pendingRuns, error: fetchError } = await supabase
      .from('scheduled_felix_runs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10); // Process max 10 at a time to avoid overload

    if (fetchError) {
      console.error('[schedule-felix-runs] Error fetching pending runs:', fetchError);
      throw fetchError;
    }

    if (!pendingRuns || pendingRuns.length === 0) {
      console.log('[schedule-felix-runs] No pending runs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending runs', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[schedule-felix-runs] Found ${pendingRuns.length} pending runs to process`);

    const results: { id: string; success: boolean; error?: string; workflow_state_id?: string }[] = [];

    for (const run of pendingRuns as ScheduledRun[]) {
      try {
        console.log(`[schedule-felix-runs] Processing run ${run.id} for city ${run.city}`);

        // Build the message in the same format as the trigger
        const searchTerms = [];
        if (run.state) searchTerms.push(`Bundesland: ${run.state}`);
        if (run.city) searchTerms.push(`Stadt: ${run.city}`);
        if (run.category) searchTerms.push(`Branche: ${run.category}`);

        const felixMessage = searchTerms.length > 0
          ? `Bitte finde Unternehmen mit folgenden Kriterien: ${searchTerms.join(', ')}`
          : 'Bitte finde Unternehmen';

        const triggerData = {
          message: felixMessage,
          maxCompanies: run.max_companies,
        };

        // Create workflow state
        const { data: workflowState, error: insertError } = await supabase
          .from('n8n_workflow_states')
          .insert({
            project_id: run.project_id,
            user_id: run.user_id,
            workflow_name: 'finder_felix',
            status: 'running',
            trigger_data: triggerData,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[schedule-felix-runs] Error creating workflow state for run ${run.id}:`, insertError);
          
          // Mark as failed
          await supabase
            .from('scheduled_felix_runs')
            .update({ 
              status: 'failed', 
              error_message: insertError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', run.id);

          results.push({ id: run.id, success: false, error: insertError.message });
          continue;
        }

        // Trigger the n8n workflow
        const n8nWebhookBaseUrl = Deno.env.get('N8N_WEBHOOK_BASE_URL');
        const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
        const n8nHeaderName = Deno.env.get('N8N_WEBHOOK_HEADER_NAME') || 'X-N8N-Webhook-Secret';

        if (!n8nWebhookBaseUrl || !n8nSecret) {
          throw new Error('N8N webhook configuration missing');
        }

        const webhookUrl = `${n8nWebhookBaseUrl}/finder-felix`;
        
        const webhookPayload = {
          workflow_id: workflowState.id,
          project_id: run.project_id,
          user_id: run.user_id,
          trigger_data: triggerData,
          // KRITISCH: message muss auf Top-Level sein, da n8n es dort erwartet
          message: triggerData.message,
          maxCompanies: triggerData.maxCompanies,
        };

        console.log(`[schedule-felix-runs] Webhook payload for run ${run.id}:`, JSON.stringify(webhookPayload, null, 2));

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [n8nHeaderName]: n8nSecret,
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error(`[schedule-felix-runs] Webhook error for run ${run.id}:`, errorText);
          
          // Update workflow state to failed
          await supabase
            .from('n8n_workflow_states')
            .update({ status: 'failed' })
            .eq('id', workflowState.id);
          
          // Mark scheduled run as failed
          await supabase
            .from('scheduled_felix_runs')
            .update({ 
              status: 'failed', 
              error_message: `Webhook error: ${webhookResponse.status}`,
              workflow_state_id: workflowState.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', run.id);

          results.push({ id: run.id, success: false, error: `Webhook error: ${webhookResponse.status}` });
          continue;
        }

        // Mark scheduled run as triggered
        await supabase
          .from('scheduled_felix_runs')
          .update({ 
            status: 'triggered', 
            workflow_state_id: workflowState.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', run.id);

        console.log(`[schedule-felix-runs] Successfully triggered run ${run.id}, workflow ${workflowState.id}`);
        results.push({ id: run.id, success: true, workflow_state_id: workflowState.id });

      } catch (runError: any) {
        console.error(`[schedule-felix-runs] Error processing run ${run.id}:`, runError);
        
        // Mark as failed
        await supabase
          .from('scheduled_felix_runs')
          .update({ 
            status: 'failed', 
            error_message: runError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', run.id);

        results.push({ id: run.id, success: false, error: runError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[schedule-felix-runs] Completed: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        successful: successCount,
        failed: failCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[schedule-felix-runs] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
