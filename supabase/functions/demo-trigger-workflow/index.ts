import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded demo IDs — these match the public RLS policies on the local DB
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000d31';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000d3a';
const DEMO_MAX_COMPANIES = 10;

// Only these workflows are allowed in demo mode (NO sende_susan!)
const ALLOWED_WORKFLOWS = new Set([
  'finder_felix',
  'analyse_anna_auto',
  'pitch_paul',
  'branding_britta',
]);

const WEBHOOK_PATHS: Record<string, string> = {
  finder_felix: '/finder-felix',
  analyse_anna_auto: '/analyse-anna-auto',
  pitch_paul: '/pitch-paul',
  branding_britta: '/branding-britta',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { workflow_name, workflow_id, trigger_data } = body as {
      workflow_name: string;
      workflow_id: string;
      trigger_data: Record<string, any>;
    };

    // ----- Validation -----
    if (!ALLOWED_WORKFLOWS.has(workflow_name)) {
      return new Response(
        JSON.stringify({ error: `Workflow '${workflow_name}' is not allowed in demo mode.` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!workflow_id || typeof workflow_id !== 'string') {
      return new Response(JSON.stringify({ error: 'workflow_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const N8N_WEBHOOK_BASE_URL = Deno.env.get('N8N_WEBHOOK_BASE_URL');
    const N8N_WEBHOOK_SECRET = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!N8N_WEBHOOK_BASE_URL || !N8N_WEBHOOK_SECRET) {
      throw new Error('N8N_WEBHOOK_BASE_URL or N8N_WEBHOOK_SECRET not configured');
    }

    // ----- Cap maxCompanies hard at 10 -----
    const safeTriggerData = { ...(trigger_data || {}) };
    const requestedMax = Number(safeTriggerData.maxCompanies);
    safeTriggerData.maxCompanies = Number.isFinite(requestedMax) && requestedMax > 0
      ? Math.min(requestedMax, DEMO_MAX_COMPANIES)
      : DEMO_MAX_COMPANIES;

    // Strip any sender data for analyse_anna_auto (defense-in-depth)
    if (workflow_name === 'analyse_anna_auto') {
      delete safeTriggerData.sellerContact;
      delete safeTriggerData.sellerName;
      delete safeTriggerData.sellerCompany;
      delete safeTriggerData.sellerPhone;
      delete safeTriggerData.sellerAddress;
      delete safeTriggerData.sellerWebsite;
      delete safeTriggerData.templateEnumName;
      delete safeTriggerData.templateId;
    }

    // ----- Build n8n URL -----
    let baseUrl = N8N_WEBHOOK_BASE_URL.replace(/\/+$/, '').replace(/\/webhook(-test)?$/, '');
    const n8nUrl = `${baseUrl}/webhook${WEBHOOK_PATHS[workflow_name]}`;

    const requestBody: any = {
      workflow_name,
      workflow_id,
      project_id: DEMO_PROJECT_ID,
      user_id: DEMO_USER_ID,
      trigger_data: safeTriggerData,
      // Lift commonly-required fields
      message: safeTriggerData.message,
      maxCompanies: safeTriggerData.maxCompanies,
      demo: true,
    };
    if (workflow_name === 'analyse_anna_auto') {
      requestBody.userGoal = safeTriggerData.userGoal;
      requestBody.analyseInstruction = safeTriggerData.analyseInstruction;
      requestBody.analyseInstructionId = safeTriggerData.analyseInstructionId;
      requestBody.analyseInstructionName = safeTriggerData.analyseInstructionName;
    }
    if (workflow_name === 'pitch_paul') {
      requestBody.userGoal = safeTriggerData.userGoal;
    }

    console.log('[demo-trigger-workflow] Calling n8n:', n8nUrl, 'maxCompanies:', safeTriggerData.maxCompanies);

    const headerName = Deno.env.get('N8N_WEBHOOK_HEADER_NAME') || 'X-Webhook-Secret';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
      'X-N8N-Webhook-Secret': N8N_WEBHOOK_SECRET,
    };
    headers[headerName] = N8N_WEBHOOK_SECRET;

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text().catch(() => '');
      console.error('[demo-trigger-workflow] n8n failed:', n8nResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `n8n responded ${n8nResponse.status}`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await n8nResponse.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ success: true, workflow_id, n8n_response: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[demo-trigger-workflow] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
