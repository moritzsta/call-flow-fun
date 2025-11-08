import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowRequest {
  workflow_name: 'finder_felix' | 'analyse_anna' | 'pitch_paul' | 'branding_britta' | 'email_sender';
  workflow_id: string;
  project_id: string;
  user_id: string;
  trigger_data: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const reqBody: any = await req.json();
    const { workflow_name, workflow_id, project_id, user_id, trigger_data, message } = reqBody as any;

    console.log(`[trigger-n8n-workflow] Starting ${workflow_name} for project ${project_id}`);

    // Get environment variables
    const N8N_WEBHOOK_BASE_URL = Deno.env.get('N8N_WEBHOOK_BASE_URL');
    const N8N_WEBHOOK_SECRET = Deno.env.get('N8N_WEBHOOK_SECRET');

    if (!N8N_WEBHOOK_BASE_URL || !N8N_WEBHOOK_SECRET) {
      throw new Error('N8N_WEBHOOK_BASE_URL or N8N_WEBHOOK_SECRET not configured');
    }

    // Map workflow names to webhook paths
    const webhookPaths: Record<string, string> = {
      finder_felix: '/finder-felix',
      analyse_anna: '/analyse-anna',
      pitch_paul: '/pitch-paul',
      branding_britta: '/branding-britta',
      email_sender: '/sende-susan',
    };

    const webhookPath = webhookPaths[workflow_name];
    if (!webhookPath) {
      throw new Error(`Unknown workflow: ${workflow_name}`);
    }

    // Build normalized n8n webhook URL (ensure '/webhook' prefix and single slashes)
    const baseUrl = (N8N_WEBHOOK_BASE_URL || '').replace(/\/+$/, '');
    const needsWebhookPrefix = !/\/webhook$/.test(baseUrl);
    const n8nUrl = `${baseUrl}${needsWebhookPrefix ? '/webhook' : ''}${webhookPath}`;
    console.log(`[trigger-n8n-workflow] Calling n8n: ${n8nUrl}`);

    const headerName = Deno.env.get('N8N_WEBHOOK_HEADER_NAME') || 'X-Webhook-Secret';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
      'X-N8N-Webhook-Secret': N8N_WEBHOOK_SECRET,
    };
    headers[headerName] = N8N_WEBHOOK_SECRET;

    // Build the request body with enhanced compatibility
    const requestBody: any = {
      workflow_name,
      workflow_id,
      project_id,
      user_id,
      ...(trigger_data || {}),
      trigger_data: trigger_data || {},
      ...(message ? { message } : {}),
    };

    // Special handling for email_sender workflow
    if (workflow_name === 'email_sender' && trigger_data) {
      requestBody.email_id = trigger_data.email_id;
      requestBody.send_all = trigger_data.send_all || false;
    }

    // Special handling for finder_felix workflow - check for duplicates
    if (workflow_name === 'finder_felix' && trigger_data) {
      requestBody.check_duplicates = true;
    }

    // Retry logic with exponential backoff for 502/network errors
    const maxAttempts = 5;
    const backoffDelays = [500, 1500, 3000, 5000, 8000];
    let n8nResponse: Response | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[trigger-n8n-workflow] Attempt ${attempt}/${maxAttempts}`);
        
        n8nResponse = await fetch(n8nUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (n8nResponse.ok) {
          break; // Success, exit retry loop
        }

        const errorText = await n8nResponse.text().catch(() => '');
        console.log(`[trigger-n8n-workflow] Status ${n8nResponse.status}: ${errorText}`);

        // Handle non-retryable errors
        if (n8nResponse.status === 401) {
          throw new Error(`Webhook authentication failed - ${errorText}`);
        }
        if (n8nResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Retry on 502 Bad Gateway or 503 Service Unavailable
        if (n8nResponse.status === 502 || n8nResponse.status === 503) {
          lastError = new Error(`${n8nResponse.status} ${n8nResponse.statusText} on attempt ${attempt}`);
          if (attempt < maxAttempts) {
            console.log(`[trigger-n8n-workflow] Retrying after ${backoffDelays[attempt - 1]}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt - 1]));
            continue;
          }
        }

        // Other errors are not retryable
        throw new Error(`Webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${errorText}`);
      } catch (error) {
        // Network/fetch errors
        if (error instanceof TypeError && attempt < maxAttempts) {
          console.log(`[trigger-n8n-workflow] Network error on attempt ${attempt}, retrying...`);
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt - 1]));
          continue;
        }
        throw error;
      }
    }

    if (!n8nResponse || !n8nResponse.ok) {
      console.warn('[trigger-n8n-workflow] All immediate retry attempts failed. Queueing background retries...');

      // Background retry task (won't block response)
      const backgroundRetry = async () => {
        try {
          const extraBackoffs = [10000, 15000, 20000];
          let bgResponse: Response | null = null;
          for (let i = 0; i < extraBackoffs.length; i++) {
            try {
              console.log(`[trigger-n8n-workflow] BG attempt ${i + 1}/${extraBackoffs.length}`);
              bgResponse = await fetch(n8nUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
              });
              if (bgResponse.ok) break;

              const txt = await bgResponse.text().catch(() => '');
              console.log(`[trigger-n8n-workflow] BG status ${bgResponse.status}: ${txt}`);

              if (bgResponse.status === 401 || bgResponse.status === 429) {
                throw new Error(`Non-retryable BG error: ${bgResponse.status}`);
              }
            } catch (e) {
              // swallow and continue bg retries
            }

            await new Promise(r => setTimeout(r, extraBackoffs[i]));
          }

          const supabaseBg = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          );

          if (bgResponse && bgResponse.ok) {
            const data = await bgResponse.json().catch(() => ({}));
            await supabaseBg.from('n8n_workflow_states').update({
              status: 'running',
              started_at: new Date().toISOString(),
            }).eq('id', workflow_id);
            console.log('[trigger-n8n-workflow] BG success, workflow set to running');
          } else {
            await supabaseBg.from('n8n_workflow_states').update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            }).eq('id', workflow_id);
            console.error('[trigger-n8n-workflow] BG failed, workflow marked as failed');
          }
        } catch (e) {
          console.error('[trigger-n8n-workflow] BG task fatal error', e);
        }
      };

      // Use Edge Runtime background execution if available
      try {
        (globalThis as any).EdgeRuntime?.waitUntil?.(backgroundRetry());
      } catch (_) {
        // Fallback: fire-and-forget
        backgroundRetry();
      }

      return new Response(
        JSON.stringify({
          success: true,
          workflow_id,
          status: 'queued',
          message: 'n8n unavailable, background retries scheduled',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 }
      );
    }

    const n8nData = await n8nResponse.json();
    console.log(`[trigger-n8n-workflow] n8n response:`, n8nData);

    // Update workflow state in DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabase
      .from('n8n_workflow_states')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', workflow_id);

    if (updateError) {
      console.error(`[trigger-n8n-workflow] DB update error:`, updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        workflow_id,
        status: 'running',
        n8n_response: n8nData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[trigger-n8n-workflow] Error:', error);

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
