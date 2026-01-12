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

// Helper: Workflow-spezifische Trigger-Daten filtern
// WICHTIG: analyse_anna_auto darf KEINE Absenderdaten erhalten!
function getTriggerDataForWorkflow(workflowName: string, config: any): Record<string, any> {
  // Basis-Daten für ALLE Workflows (Ort/Branche)
  const baseData = {
    city: config?.city,
    state: config?.state,
    category: config?.category,
    maxCompanies: config?.maxCompanies,
  };

  switch (workflowName) {
    case 'finder_felix':
      // Nur Ort/Branche - keine Absenderdaten
      return baseData;
      
    case 'analyse_anna_auto':
      // Nur Basis + userGoal, KEINE Absenderdaten!
      return {
        ...baseData,
        userGoal: config?.vorhaben,
      };
      
    case 'pitch_paul_auto':
    case 'branding_britta_auto':
      // Alle Daten inkl. Absender
      return {
        ...baseData,
        userGoal: config?.vorhaben,
        vorhaben: config?.vorhaben,
        templateEnumName: config?.templateEnumName,
        templateId: config?.templateId,
        sellerContact: config?.sellerContact,
        sellerName: config?.sellerContact?.name,
        sellerCompany: config?.sellerContact?.company,
        sellerPhone: config?.sellerContact?.phone,
        sellerAddress: config?.sellerContact?.address,
        sellerWebsite: config?.sellerContact?.website,
      };
      
    default:
      return baseData;
  }
}

// Proactive check for stuck workflows (runs on every advance-pipeline call)
async function checkAndRecoverStuckWorkflows(supabase: any, pipeline: Pipeline): Promise<boolean> {
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  const workflowIds = [
    pipeline.felix_workflow_id,
    pipeline.anna_workflow_id,
    pipeline.paul_workflow_id,
    pipeline.britta_workflow_id,
  ].filter(Boolean);

  if (workflowIds.length === 0) return false;

  const { data: activeWorkflows } = await supabase
    .from('n8n_workflow_states')
    .select('id, workflow_name, status, updated_at')
    .in('id', workflowIds)
    .in('status', ['running', 'alive']);

  if (!activeWorkflows || activeWorkflows.length === 0) return false;

  for (const workflow of activeWorkflows) {
    const timeSinceUpdate = Date.now() - new Date(workflow.updated_at).getTime();
    
    if (timeSinceUpdate >= INACTIVITY_TIMEOUT) {
      console.log(`[advance-pipeline] Auto-recovery: ${workflow.workflow_name} stuck for ${Math.floor(timeSinceUpdate / 1000)}s - marking as failed`);
      
      await supabase
        .from('n8n_workflow_states')
        .update({ status: 'failed' })
        .eq('id', workflow.id);
        
      return true; // Signal that recovery is needed
    }
  }
  return false;
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
    
    // EXPLIZIT: Kein Pipeline-Kontext = Standalone-Modul (Einzel-Batch)
    // In diesem Fall: Workflow als completed markieren, aber KEINE Pipeline-Fortsetzung
    if (!pipeline) {
      console.log(`[advance-pipeline] Mode: STANDALONE (no pipeline found for workflow_id: ${body.workflow_id})`);
      
      // Wenn n8n "completed" meldet, markiere den Workflow als abgeschlossen
      if (body.status === 'completed') {
        const { error: updateError } = await supabase
          .from('n8n_workflow_states')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', body.workflow_id);
        
        if (updateError) {
          console.error('[advance-pipeline] Error updating standalone workflow:', updateError);
        } else {
          console.log('[advance-pipeline] Standalone workflow marked as completed');
        }
      } else if (body.status === 'failed') {
        // Bei Fehler auch den Status aktualisieren
        await supabase
          .from('n8n_workflow_states')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', body.workflow_id);
        
        console.log('[advance-pipeline] Standalone workflow marked as failed');
      }
      
      return new Response(
        JSON.stringify({ 
          message: 'Standalone workflow - no pipeline context, no continuation',
          workflow_id: body.workflow_id,
          workflow_name: body.workflow_name,
          status: body.status,
          standalone: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[advance-pipeline] Mode: PIPELINE (pipeline_id: ${pipeline.id}, current_phase: ${pipeline.current_phase})`);

    // Proactive check: Auto-recover any stuck workflows in this pipeline
    const recoveryNeeded = await checkAndRecoverStuckWorkflows(supabase, pipeline);
    if (recoveryNeeded) {
      console.log('[advance-pipeline] Stuck workflow detected and marked as failed, triggering recovery...');
      return await handleRecovery(supabase, pipeline.id);
    }

    // Normalize workflow name (convert dashes to underscores for consistency)
    // This handles cases where n8n sends 'finder-felix' instead of 'finder_felix'
    const normalizedWorkflowName = body.workflow_name.replace(/-/g, '_');
    console.log('Normalized workflow name:', body.workflow_name, '→', normalizedWorkflowName);

    // Determine next workflow
    const currentIndex = WORKFLOW_SEQUENCE.indexOf(normalizedWorkflowName);
    const nextWorkflow = currentIndex >= 0 && currentIndex < WORKFLOW_SEQUENCE.length - 1
      ? WORKFLOW_SEQUENCE[currentIndex + 1]
      : null;

    console.log('Current workflow:', normalizedWorkflowName, 'Next workflow:', nextWorkflow);

    // Atomic reservation: Check and reserve the next workflow slot atomically
    if (nextWorkflow) {
      // Try to atomically reserve the slot by updating current_phase to 'nextWorkflow_reserving'
      // Only succeeds if current_phase matches the normalizedWorkflowName (previous phase)
      const { data: reserved, error: reserveError } = await supabase
        .from('automation_pipelines')
        .update({ 
          current_phase: `${nextWorkflow}_reserving`
        })
        .eq('id', pipeline.id)
        .eq('current_phase', normalizedWorkflowName)
        .select()
        .single();

      if (reserveError) {
        console.error('Error during atomic reservation:', reserveError);
      }

      if (!reserved) {
        console.log('Another request already reserved this workflow slot:', nextWorkflow);
        console.log('Skipping trigger - workflow is being created by another parallel request or phase already changed');
        
        return new Response(
          JSON.stringify({ 
            message: 'Next workflow already being created by another request, skipping duplicate trigger',
            next_workflow: nextWorkflow,
            pipeline_id: pipeline.id,
            skipped: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Successfully reserved workflow slot:', nextWorkflow);
    }

    // Update pipeline status if completed (no atomic update needed here since reservation already done)
    if (!nextWorkflow) {
      await supabase
        .from('automation_pipelines')
        .update({ 
          current_phase: 'completed',
          status: 'completed', 
          completed_at: new Date().toISOString()
        })
        .eq('id', pipeline.id);
      
      console.log('Updated pipeline status to completed');
    }

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

    // After analyse_anna_auto and before pitch_paul_auto: Remove duplicates and cleanup
    if (normalizedWorkflowName === 'analyse_anna_auto' && nextWorkflow === 'pitch_paul_auto') {
      // Step 1: Remove duplicate companies (same phone, email, or website)
      console.log(`Removing company duplicates for project ${pipeline.project_id}`);
      const { data: duplicateResult, error: duplicateError } = await supabase.functions.invoke(
        'remove-duplicate-companies',
        { body: { project_id: pipeline.project_id } }
      );
      
      if (duplicateError) {
        console.error('Error removing company duplicates:', duplicateError);
      } else {
        console.log('Company duplicate removal result:', duplicateResult);
      }

      // Step 2: Cleanup companies to limit (if configured)
      const maxCompanies = pipeline.config?.maxCompanies;
      
      if (maxCompanies && maxCompanies > 0) {
        console.log(`Cleanup: Reducing companies to max ${maxCompanies} for project ${pipeline.project_id}`);
        await cleanupCompaniesToLimit(supabase, pipeline.project_id, maxCompanies);
      }
    }

    // After pitch_paul_auto and before branding_britta_auto: Remove email duplicates
    if (normalizedWorkflowName === 'pitch_paul_auto' && nextWorkflow === 'branding_britta_auto') {
      console.log(`Removing email duplicates for project ${pipeline.project_id}`);
      const { data: emailDuplicateResult, error: emailDuplicateError } = await supabase.functions.invoke(
        'remove-duplicate-emails',
        { body: { project_id: pipeline.project_id } }
      );
      
      if (emailDuplicateError) {
        console.error('Error removing email duplicates:', emailDuplicateError);
      } else {
        console.log('Email duplicate removal result:', emailDuplicateResult);
      }
    }

    // Create new workflow state for next workflow with filtered trigger_data
    const filteredTriggerData = getTriggerDataForWorkflow(nextWorkflow, pipeline.config);
    console.log(`[advance-pipeline] Filtered trigger_data for ${nextWorkflow}:`, JSON.stringify(filteredTriggerData, null, 2));
    
    // Create new workflow state with pipeline_id for explicit context tracking
    const { data: newWorkflowState, error: workflowStateError } = await supabase
      .from('n8n_workflow_states')
      .insert({
        workflow_name: nextWorkflow,
        project_id: pipeline.project_id,
        user_id: pipeline.user_id,
        status: 'pending',
        trigger_data: filteredTriggerData,
        pipeline_id: pipeline.id  // WICHTIG: Explizite Pipeline-Zuordnung
      })
      .select()
      .single();

    if (workflowStateError) {
      console.error('Error creating workflow state:', workflowStateError);
      throw workflowStateError;
    }

    console.log('Created new workflow state:', newWorkflowState.id);

    // Update pipeline with new workflow_id and finalize the phase transition
    const workflowIdField = WORKFLOW_ID_MAPPING[nextWorkflow as keyof typeof WORKFLOW_ID_MAPPING];
    await supabase
      .from('automation_pipelines')
      .update({ 
        [workflowIdField]: newWorkflowState.id,
        current_phase: nextWorkflow  // Finalize: from 'xxx_reserving' to 'xxx'
      })
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
          trigger_data: filteredTriggerData
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
      // This workflow hasn't been started yet, it's the next one to start
      nextWorkflowName = workflowName;
      break;
    }

    const workflowState = workflowStates?.find((ws: any) => ws.id === workflowId);
    
    // Skip completed or failed workflows - they're done
    if (!workflowState || workflowState.status === 'completed' || workflowState.status === 'failed') {
      continue;
    }
    
    // Found a running/alive workflow - this is the stuck one
    if (workflowState.status === 'running' || workflowState.status === 'alive') {
      stuckWorkflowName = workflowName;
      nextWorkflowName = i < WORKFLOW_SEQUENCE.length - 1 ? WORKFLOW_SEQUENCE[i + 1] : null;
      
      // Mark current as failed
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

  // Check if next workflow already exists and is active
  const nextWorkflowIdField = WORKFLOW_ID_MAPPING[nextWorkflowName as keyof typeof WORKFLOW_ID_MAPPING];
  const existingNextWorkflowId = pipeline[nextWorkflowIdField];
  
  if (existingNextWorkflowId) {
    const existingWorkflow = workflowStates?.find((ws: any) => ws.id === existingNextWorkflowId);
    
    // If next workflow already exists and is running/alive/pending, don't create duplicate
    if (existingWorkflow && (existingWorkflow.status === 'running' || existingWorkflow.status === 'alive' || existingWorkflow.status === 'pending')) {
      console.log('Next workflow already exists and is active:', nextWorkflowName, existingNextWorkflowId);
      return new Response(
        JSON.stringify({ 
          message: 'Next workflow already running, skipping duplicate trigger',
          next_workflow: nextWorkflowName,
          existing_workflow_id: existingNextWorkflowId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Update pipeline phase
  await supabase
    .from('automation_pipelines')
    .update({ current_phase: nextWorkflowName })
    .eq('id', pipelineId);

  // Wait 30 seconds before triggering next workflow (same as normal flow)
  // This ensures the timer animation shows in the frontend
  console.log('[handleRecovery] Waiting 30 seconds before triggering next workflow...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Create new workflow state with filtered trigger_data
  const recoveryTriggerData = getTriggerDataForWorkflow(nextWorkflowName, pipeline.config);
  console.log(`[advance-pipeline] Recovery trigger_data for ${nextWorkflowName}:`, JSON.stringify(recoveryTriggerData, null, 2));
  
  const { data: newWorkflowState, error: workflowStateError } = await supabase
    .from('n8n_workflow_states')
    .insert({
      workflow_name: nextWorkflowName,
      project_id: pipeline.project_id,
      user_id: pipeline.user_id,
      status: 'pending',
      trigger_data: recoveryTriggerData,
      pipeline_id: pipelineId  // FIX: Pipeline-Zuordnung hinzufügen
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
      trigger_data: recoveryTriggerData
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

// ============= Company Cleanup Functions =============

async function cleanupCompaniesToLimit(
  supabase: any, 
  projectId: string, 
  maxCompanies: number
): Promise<void> {
  // 1. Count current companies
  const { count: currentCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (!currentCount || currentCount <= maxCompanies) {
    console.log(`Cleanup: Already at or below limit (${currentCount}/${maxCompanies})`);
    return;
  }

  let toDelete = currentCount - maxCompanies;
  console.log(`Cleanup: Need to delete ${toDelete} companies (current: ${currentCount}, limit: ${maxCompanies})`);

  // Priority 1: Without website
  if (toDelete > 0) {
    const deleted = await deleteCompaniesWithoutField(
      supabase, projectId, 'website', toDelete
    );
    toDelete -= deleted;
    console.log(`Cleanup: Deleted ${deleted} companies without website, ${toDelete} remaining`);
  }

  // Priority 2: Without analysis
  if (toDelete > 0) {
    const deleted = await deleteCompaniesWithoutAnalysis(
      supabase, projectId, toDelete
    );
    toDelete -= deleted;
    console.log(`Cleanup: Deleted ${deleted} companies without analysis, ${toDelete} remaining`);
  }

  // Priority 3: Without email
  if (toDelete > 0) {
    const deleted = await deleteCompaniesWithoutField(
      supabase, projectId, 'email', toDelete
    );
    toDelete -= deleted;
    console.log(`Cleanup: Deleted ${deleted} companies without email, ${toDelete} remaining`);
  }

  // Priority 4: Any remaining (oldest first)
  if (toDelete > 0) {
    const deleted = await deleteAnyCompanies(supabase, projectId, toDelete);
    console.log(`Cleanup: Deleted ${deleted} remaining companies (oldest first)`);
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  console.log(`Cleanup completed: ${currentCount} → ${finalCount} companies (target: ${maxCompanies})`);
}

async function deleteCompaniesWithoutField(
  supabase: any,
  projectId: string,
  field: 'website' | 'email',
  limit: number
): Promise<number> {
  // Find IDs of companies to delete
  const { data: toDelete } = await supabase
    .from('companies')
    .select('id')
    .eq('project_id', projectId)
    .or(`${field}.is.null,${field}.eq.`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!toDelete || toDelete.length === 0) return 0;

  const ids = toDelete.map((c: any) => c.id);
  const { error } = await supabase
    .from('companies')
    .delete()
    .in('id', ids);

  if (error) {
    console.error(`Error deleting companies without ${field}:`, error);
    return 0;
  }

  return ids.length;
}

async function deleteCompaniesWithoutAnalysis(
  supabase: any,
  projectId: string,
  limit: number
): Promise<number> {
  const { data: toDelete } = await supabase
    .from('companies')
    .select('id')
    .eq('project_id', projectId)
    .is('analysis', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!toDelete || toDelete.length === 0) return 0;

  const ids = toDelete.map((c: any) => c.id);
  const { error } = await supabase
    .from('companies')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting companies without analysis:', error);
    return 0;
  }

  return ids.length;
}

async function deleteAnyCompanies(
  supabase: any,
  projectId: string,
  limit: number
): Promise<number> {
  const { data: toDelete } = await supabase
    .from('companies')
    .select('id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!toDelete || toDelete.length === 0) return 0;

  const ids = toDelete.map((c: any) => c.id);
  const { error } = await supabase
    .from('companies')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting any companies:', error);
    return 0;
  }

  return ids.length;
}
