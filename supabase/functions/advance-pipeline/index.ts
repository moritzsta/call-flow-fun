import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvancePipelineRequest {
  workflow_id?: string;
  workflow_name?: string;
  status?: string;
  recover?: boolean;
  pipeline_id?: string;
}

interface Pipeline {
  id: string;
  project_id: string;
  user_id: string;
  status: string;
  current_phase: string | null;
  felix_workflow_id: string | null;
  anna_workflow_id: string | null;
  paul_workflow_id: string | null;
  britta_workflow_id: string | null;
  config: any;
}

// Workflow sequence: finder_felix → analyse_anna_auto → pitch_paul_auto → branding_britta_auto → completed
const WORKFLOW_SEQUENCE = [
  'finder_felix',
  'analyse_anna_auto',
  'pitch_paul_auto',
  'branding_britta_auto'
];

const WORKFLOW_ID_MAPPING = {
  'finder_felix': 'felix_workflow_id',
  'analyse_anna_auto': 'anna_workflow_id',
  'pitch_paul_auto': 'paul_workflow_id',
  'branding_britta_auto': 'britta_workflow_id',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AdvancePipelineRequest = await req.json();
    console.log('advance-pipeline called with:', body);

    // Recovery mode
    if (body.recover && body.pipeline_id) {
      return await handleRecovery(supabase, body.pipeline_id);
    }

    // Normal mode: triggered by n8n after workflow completion
    if (!body.workflow_id || !body.workflow_name || !body.status) {
      return new Response(
        JSON.stringify({ error: 'Missing workflow_id, workflow_name, or status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the pipeline associated with this workflow
    const pipeline = await findPipelineByWorkflowId(supabase, body.workflow_id);
    
    if (!pipeline) {
      console.log('No pipeline found for workflow_id:', body.workflow_id);
      return new Response(
        JSON.stringify({ message: 'No pipeline found for this workflow' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found pipeline:', pipeline.id, 'current_phase:', pipeline.current_phase);

    // Determine next workflow
    const currentIndex = WORKFLOW_SEQUENCE.indexOf(body.workflow_name);
    const nextWorkflow = currentIndex >= 0 && currentIndex < WORKFLOW_SEQUENCE.length - 1
      ? WORKFLOW_SEQUENCE[currentIndex + 1]
      : null;

    console.log('Current workflow:', body.workflow_name, 'Next workflow:', nextWorkflow);

    // Update current_phase
    const newPhase = nextWorkflow || 'completed';
    await supabase
      .from('automation_pipelines')
      .update({ 
        current_phase: newPhase,
        ...(newPhase === 'completed' ? { status: 'completed', completed_at: new Date().toISOString() } : {})
      })
      .eq('id', pipeline.id);

    console.log('Updated pipeline phase to:', newPhase);

    // If no next workflow, mark as completed
    if (!nextWorkflow) {
      console.log('Pipeline completed:', pipeline.id);
      return new Response(
        JSON.stringify({ message: 'Pipeline completed', pipeline_id: pipeline.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Wait 30 seconds before triggering next workflow
    console.log('Waiting 30 seconds before triggering next workflow...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Create new workflow state for next workflow
    const { data: newWorkflowState, error: workflowStateError } = await supabase
      .from('n8n_workflow_states')
      .insert({
        workflow_name: nextWorkflow,
        project_id: pipeline.project_id,
        user_id: pipeline.user_id,
        status: 'pending',
        trigger_data: pipeline.config
      })
      .select()
      .single();

    if (workflowStateError) {
      console.error('Error creating workflow state:', workflowStateError);
      throw workflowStateError;
    }

    console.log('Created new workflow state:', newWorkflowState.id);

    // Update pipeline with new workflow_id
    const workflowIdField = WORKFLOW_ID_MAPPING[nextWorkflow as keyof typeof WORKFLOW_ID_MAPPING];
    await supabase
      .from('automation_pipelines')
      .update({ [workflowIdField]: newWorkflowState.id })
      .eq('id', pipeline.id);

    // Trigger next workflow via trigger-n8n-workflow edge function
    console.log('Triggering next workflow:', nextWorkflow);
    const { data: triggerData, error: triggerError } = await supabase.functions.invoke(
      'trigger-n8n-workflow',
      {
        body: {
          workflow_name: nextWorkflow,
          workflow_id: newWorkflowState.id,
          project_id: pipeline.project_id,
          user_id: pipeline.user_id,
          trigger_data: pipeline.config
        }
      }
    );

    if (triggerError) {
      console.error('Error triggering workflow:', triggerError);
      await supabase
        .from('n8n_workflow_states')
        .update({ status: 'failed' })
        .eq('id', newWorkflowState.id);
      throw triggerError;
    }

    console.log('Successfully triggered next workflow:', nextWorkflow);

    return new Response(
      JSON.stringify({ 
        message: 'Next workflow triggered',
        next_workflow: nextWorkflow,
        workflow_id: newWorkflowState.id,
        pipeline_id: pipeline.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in advance-pipeline:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function findPipelineByWorkflowId(supabase: any, workflowId: string): Promise<Pipeline | null> {
  // Try to find pipeline by any of the workflow_id fields
  const { data, error } = await supabase
    .from('automation_pipelines')
    .select('*')
    .or(`felix_workflow_id.eq.${workflowId},anna_workflow_id.eq.${workflowId},paul_workflow_id.eq.${workflowId},britta_workflow_id.eq.${workflowId}`)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error finding pipeline:', error);
    return null;
  }

  return data;
}

async function handleRecovery(supabase: any, pipelineId: string) {
  console.log('Recovery mode for pipeline:', pipelineId);

  // Get pipeline
  const { data: pipeline, error: pipelineError } = await supabase
    .from('automation_pipelines')
    .select('*')
    .eq('id', pipelineId)
    .single();

  if (pipelineError || !pipeline) {
    return new Response(
      JSON.stringify({ error: 'Pipeline not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get all workflow states
  const workflowIds = [
    pipeline.felix_workflow_id,
    pipeline.anna_workflow_id,
    pipeline.paul_workflow_id,
    pipeline.britta_workflow_id
  ].filter(id => id !== null);

  const { data: workflowStates } = await supabase
    .from('n8n_workflow_states')
    .select('*')
    .in('id', workflowIds);

  console.log('Workflow states:', workflowStates);

  // Find first non-completed workflow
  let stuckWorkflowName: string | null = null;
  let nextWorkflowName: string | null = null;

  for (let i = 0; i < WORKFLOW_SEQUENCE.length; i++) {
    const workflowName = WORKFLOW_SEQUENCE[i];
    const workflowIdField = WORKFLOW_ID_MAPPING[workflowName as keyof typeof WORKFLOW_ID_MAPPING];
    const workflowId = pipeline[workflowIdField];

    if (!workflowId) {
      // This workflow hasn't been started yet, it's the next one
      nextWorkflowName = workflowName;
      break;
    }

    const workflowState = workflowStates?.find((ws: any) => ws.id === workflowId);
    if (workflowState && workflowState.status !== 'completed') {
      // Found stuck workflow
      stuckWorkflowName = workflowName;
      nextWorkflowName = i < WORKFLOW_SEQUENCE.length - 1 ? WORKFLOW_SEQUENCE[i + 1] : null;
      
      // Mark as skipped
      await supabase
        .from('n8n_workflow_states')
        .update({ status: 'failed' })
        .eq('id', workflowId);
      
      console.log('Marked workflow as failed:', workflowName);
      break;
    }
  }

  if (!nextWorkflowName) {
    // All workflows completed or no next workflow
    await supabase
      .from('automation_pipelines')
      .update({ 
        status: 'completed',
        current_phase: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', pipelineId);

    return new Response(
      JSON.stringify({ message: 'Pipeline marked as completed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Recovering: stuck workflow =', stuckWorkflowName, 'next workflow =', nextWorkflowName);

  // Update pipeline phase
  await supabase
    .from('automation_pipelines')
    .update({ current_phase: nextWorkflowName })
    .eq('id', pipelineId);

  // Create new workflow state
  const { data: newWorkflowState, error: workflowStateError } = await supabase
    .from('n8n_workflow_states')
    .insert({
      workflow_name: nextWorkflowName,
      project_id: pipeline.project_id,
      user_id: pipeline.user_id,
      status: 'pending',
      trigger_data: pipeline.config
    })
    .select()
    .single();

  if (workflowStateError) {
    console.error('Error creating workflow state:', workflowStateError);
    throw workflowStateError;
  }

  // Update pipeline with new workflow_id
  const workflowIdField = WORKFLOW_ID_MAPPING[nextWorkflowName as keyof typeof WORKFLOW_ID_MAPPING];
  await supabase
    .from('automation_pipelines')
    .update({ [workflowIdField]: newWorkflowState.id })
    .eq('id', pipelineId);

  // Trigger next workflow
  console.log('Triggering recovery workflow:', nextWorkflowName);
  await supabase.functions.invoke('trigger-n8n-workflow', {
    body: {
      workflow_name: nextWorkflowName,
      workflow_id: newWorkflowState.id,
      project_id: pipeline.project_id,
      user_id: pipeline.user_id,
      trigger_data: pipeline.config
    }
  });

  return new Response(
    JSON.stringify({ 
      message: 'Pipeline recovered',
      stuck_workflow: stuckWorkflowName,
      next_workflow: nextWorkflowName,
      workflow_id: newWorkflowState.id
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
