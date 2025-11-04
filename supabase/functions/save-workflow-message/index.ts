import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveMessageRequest {
  workflow_state_id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { workflow_state_id, project_id, role, content, metadata }: SaveMessageRequest =
      await req.json();

    console.log(`[save-workflow-message] Saving message for workflow ${workflow_state_id}`);

    // Validate required fields
    if (!workflow_state_id || !project_id || !role || !content) {
      throw new Error('Missing required fields: workflow_state_id, project_id, role, content');
    }

    // Use service role key to bypass RLS (n8n doesn't have user auth)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify workflow state exists (or create it)
    const { data: workflowState, error: stateError } = await supabase
      .from('n8n_workflow_states')
      .select('id, project_id, user_id')
      .eq('id', workflow_state_id)
      .maybeSingle();

    if (stateError) {
      console.error('[save-workflow-message] Error querying workflow state:', stateError);
      throw new Error(`Database error: ${stateError.message}`);
    }

    // Auto-create workflow state if it doesn't exist
    if (!workflowState) {
      console.log(`[save-workflow-message] Workflow state not found, creating new one: ${workflow_state_id}`);
      
      const workflowName = metadata?.workflow_name || 'unknown';
      
      const { data: newState, error: createError } = await supabase
        .from('n8n_workflow_states')
        .insert({
          id: workflow_state_id,
          project_id: project_id,
          user_id: metadata?.user_id || null,
          workflow_name: workflowName,
          status: 'running',
          conversation_active: true,
          trigger_data: metadata || {},
        })
        .select('id, project_id')
        .single();

      if (createError) {
        console.error('[save-workflow-message] Failed to create workflow state:', createError);
        throw new Error(`Failed to create workflow state: ${createError.message}`);
      }

      console.log(`[save-workflow-message] Created new workflow state: ${newState.id}`);
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('workflow_messages')
      .insert({
        workflow_state_id,
        project_id,
        role,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('[save-workflow-message] Insert error:', insertError);
      throw insertError;
    }

    // Update last_message_at in workflow state
    await supabase
      .from('n8n_workflow_states')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', workflow_state_id);

    console.log(`[save-workflow-message] Message saved successfully: ${message.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: message.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[save-workflow-message] Error:', error);

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
