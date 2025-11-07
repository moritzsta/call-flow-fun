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
    };
    headers[headerName] = N8N_WEBHOOK_SECRET;

    // Build the request body
    const requestBody: any = {
      workflow_id,
      project_id,
      user_id,
      ...(trigger_data || {}),
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

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => '');
      if (n8nResponse.status === 401) {
        throw new Error(`Webhook authentication failed - ${errorText}`);
      }
      if (n8nResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${errorText}`);
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
