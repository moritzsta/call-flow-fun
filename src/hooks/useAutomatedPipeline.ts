import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowChat } from './useWorkflowChat';
import { toast } from 'sonner';

interface PipelineConfig {
  city: string;
  state: string;
  category: string;
  vorhaben: string;
  maxCompanies?: number;
}

interface StartPipelineParams {
  projectId: string;
  userId: string;
  config: PipelineConfig;
}

type PipelinePhase = 'felix' | 'anna' | 'paul' | 'britta';
type PipelineStatus = 'idle' | 'running' | 'completed' | 'failed';

export const useAutomatedPipeline = (projectId?: string) => {
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check for active pipeline on mount
  const { data: existingPipeline } = useQuery({
    queryKey: ['active-pipeline', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('automation_pipelines')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Restore state from existing pipeline
  useEffect(() => {
    if (existingPipeline) {
      console.log('[Pipeline] Restored active pipeline:', existingPipeline.id);
      setActivePipelineId(existingPipeline.id);
      setPipelineStatus('running');
      setCurrentPhase(existingPipeline.current_phase as PipelinePhase || null);
    }
  }, [existingPipeline]);

  // Subscribe to pipeline status updates
  useEffect(() => {
    if (!activePipelineId || !projectId) return;

    console.log('[Pipeline] Subscribing to pipeline updates:', activePipelineId);

    const channel = supabase
      .channel(`pipeline-${activePipelineId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'automation_pipelines',
          filter: `id=eq.${activePipelineId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          console.log('[Pipeline] Received update:', updated);
          setPipelineStatus(updated.status);
          setCurrentPhase(updated.current_phase as PipelinePhase || null);
          
          if (updated.status === 'completed' || updated.status === 'failed') {
            console.log('[Pipeline] Pipeline finished:', updated.status);
            setActivePipelineId(null);
            queryClient.invalidateQueries({ queryKey: ['active-pipeline', projectId] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Pipeline] Unsubscribing from pipeline updates');
      supabase.removeChannel(channel);
    };
  }, [activePipelineId, projectId, queryClient]);

  // Initialize chat instances for each workflow
  const felixChat = useWorkflowChat({
    workflowName: 'finder_felix',
    projectId: projectId || '',
  });

  const annaChat = useWorkflowChat({
    workflowName: 'analyse_anna',
    projectId: projectId || '',
  });

  const paulChat = useWorkflowChat({
    workflowName: 'pitch_paul',
    projectId: projectId || '',
  });

  const brittaChat = useWorkflowChat({
    workflowName: 'branding_britta',
    projectId: projectId || '',
  });

  const waitForWorkflowAndCheckActivity = async (
    workflowId: string, 
    projectId: string, 
    workflowName?: string
  ): Promise<'completed' | 'timeout'> => {
    // Initial State Check AUSSERHALB der Promise
    const { data: initialState, error: fetchError } = await supabase
      .from('n8n_workflow_states')
      .select('status, updated_at')
      .eq('id', workflowId)
      .single();
      
    if (fetchError) {
      console.error(`[Pipeline] Error fetching initial workflow state for ${workflowId}:`, fetchError);
    } else if (initialState) {
      console.log(`[Pipeline] Initial status for ${workflowId}: ${initialState.status}`);
      
      // Direkt zurückgeben wenn bereits completed oder failed
      if (initialState.status === 'completed') {
        console.log('[Pipeline] Workflow already completed');
        return 'completed';
      }
      
      if (initialState.status === 'failed') {
        console.log('[Pipeline] Workflow already failed');
        return 'timeout';
      }
    }
    
    // Promise ohne async Executor
    return new Promise((resolve, reject) => {
      let lastUpdateTime = initialState?.updated_at 
        ? new Date(initialState.updated_at).getTime() 
        : Date.now();
      const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 Minuten
      
      
      // Inaktivitäts-Check (alle 30 Sekunden)
      const inactivityCheck = setInterval(async () => {
        const { data: currentState } = await supabase
          .from('n8n_workflow_states')
          .select('status, updated_at')
          .eq('id', workflowId)
          .single();
          
        if (!currentState) return;
        
        const currentUpdateTime = new Date(currentState.updated_at).getTime();
        const timeSinceUpdate = Date.now() - currentUpdateTime;
        
        console.log(`[Pipeline] Inactivity check - ${workflowId}: ${Math.floor(timeSinceUpdate / 1000)}s since last update`);
        
        // Wenn completed → fertig
        if (currentState.status === 'completed') {
          console.log(`[Pipeline] Workflow ${workflowId} completed via inactivity check`);
          cleanup();
          resolve('completed');
          return;
        }
        
        // Wenn failed → timeout
        if (currentState.status === 'failed') {
          console.log(`[Pipeline] Workflow ${workflowId} failed via inactivity check`);
          cleanup();
          resolve('timeout');
          return;
        }
        
        // Wenn 5 Minuten keine Updates → Timeout
        if (timeSinceUpdate >= INACTIVITY_TIMEOUT) {
          console.warn(`[Pipeline] Workflow ${workflowId} inactive for 5 minutes - marking as failed, pipeline continues`);
          
          // Status auf "failed" setzen
          await supabase
            .from('n8n_workflow_states')
            .update({ status: 'failed' })
            .eq('id', workflowId);
          
          cleanup();
          resolve('timeout');
          return;
        }
        
        // Update lastUpdateTime wenn es neue Updates gab
        if (currentUpdateTime > lastUpdateTime) {
          lastUpdateTime = currentUpdateTime;
        }
      }, 30000); // Alle 30 Sekunden
      
      // Realtime Subscription für sofortige Updates
      const channel = supabase
        .channel(`workflow-completion:${workflowId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'n8n_workflow_states',
            filter: `id=eq.${workflowId}`,
          },
          (payload) => {
            const status = payload.new.status;
            const updated_at = payload.new.updated_at;
            
            console.log(`[Pipeline] Realtime update - ${workflowId}: ${status}`);
            
            // Update lastUpdateTime
            lastUpdateTime = new Date(updated_at).getTime();
            
            if (status === 'completed') {
              cleanup();
              resolve('completed');
              return;
            } else if (status === 'failed') {
              cleanup();
              resolve('timeout');
              return;
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Pipeline] Subscription status for ${workflowId}: ${status}`);
        });
      
      const cleanup = () => {
        clearInterval(inactivityCheck);
        supabase.removeChannel(channel);
      };
    });
  };

  const startPipeline = useMutation({
    mutationFn: async ({ projectId, userId, config }: StartPipelineParams) => {
      // Check if there's already a running pipeline
      if (activePipelineId) {
        throw new Error('Es läuft bereits eine Pipeline für dieses Projekt');
      }

      console.log('[Pipeline] Starting new pipeline...');
      setPipelineStatus('running');

      // 1. Create pipeline record
      const { data: pipeline, error: pipelineError } = await supabase
        .from('automation_pipelines')
        .insert([{
          project_id: projectId,
          user_id: userId,
          status: 'running',
          config: config as any,
          current_phase: 'felix',
        }])
        .select()
        .single();

      if (pipelineError || !pipeline) {
        throw new Error(`Pipeline-Erstellung fehlgeschlagen: ${pipelineError?.message}`);
      }

      const pipelineId = pipeline.id;
      setActivePipelineId(pipelineId);

      try {
        // 2. Trigger Finder Felix via Chat
        console.log('[Pipeline] Starting Finder Felix...');
        setCurrentPhase('felix');
        
        const felixMessage = `System-Message: Suche mir bitte alle Firmen zur Kategorie "${config.category}" in der Stadt ${config.city}, ${config.state}${config.maxCompanies ? `. Begrenze deine Suche auf ${config.maxCompanies} Firmen` : ''}`;
        const felixWorkflowId = await felixChat.sendMessage(felixMessage);
        
        if (!felixWorkflowId) {
          throw new Error('Felix Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ felix_workflow_id: felixWorkflowId })
          .eq('id', pipelineId);

        const felixResult = await waitForWorkflowAndCheckActivity(felixWorkflowId, projectId, 'finder_felix');
        
        if (felixResult === 'timeout') {
          console.warn('[Pipeline] Felix timed out, but continuing pipeline...');
          toast.warning('Finder Felix wurde beendet (keine Aktivität), Pipeline läuft weiter');
        } else {
          console.log('[Pipeline] Finder Felix completed');
        }

        // 2 Minuten Wartezeit vor Anna
        console.log('[Pipeline] Waiting 2 minutes before starting Anna...');
        await new Promise(resolve => setTimeout(resolve, 120000));

        // 3. Trigger Analyse Anna Auto (without chat)
        console.log('[Pipeline] Starting Analyse Anna Auto...');
        setCurrentPhase('anna');
        
        // Create workflow state directly
        const { data: annaState, error: annaStateError } = await supabase
          .from('n8n_workflow_states')
          .insert({
            project_id: projectId,
            user_id: userId,
            workflow_name: 'analyse_anna_auto',
            status: 'pending',
            trigger_data: { userGoal: config.vorhaben },
          })
          .select()
          .single();

        if (annaStateError || !annaState) {
          throw new Error(`Anna Workflow-State konnte nicht erstellt werden: ${annaStateError?.message}`);
        }

        const annaWorkflowId = annaState.id;

        await supabase
          .from('automation_pipelines')
          .update({ anna_workflow_id: annaWorkflowId })
          .eq('id', pipelineId);

        // Trigger Edge Function directly
        const { error: triggerError } = await supabase.functions.invoke('trigger-n8n-workflow', {
          body: {
            workflow_name: 'analyse_anna_auto',
            workflow_id: annaWorkflowId,
            project_id: projectId,
            user_id: userId,
            trigger_data: {
              userGoal: config.vorhaben,
            },
          },
        });

        if (triggerError) {
          throw new Error(`Anna Workflow Trigger fehlgeschlagen: ${triggerError.message}`);
        }

        const annaResult = await waitForWorkflowAndCheckActivity(annaWorkflowId, projectId, 'analyse_anna_auto');
        
        if (annaResult === 'timeout') {
          console.warn('[Pipeline] Anna timed out, but continuing pipeline...');
          toast.warning('Analyse Anna wurde beendet (keine Aktivität), Pipeline läuft weiter');
        } else {
          console.log('[Pipeline] Analyse Anna completed');
        }

        // 2 Minuten Wartezeit vor Paul
        console.log('[Pipeline] Waiting 2 minutes before starting Paul...');
        await new Promise(resolve => setTimeout(resolve, 120000));

        // 4. Trigger Pitch Paul via Chat
        console.log('[Pipeline] Starting Pitch Paul...');
        setCurrentPhase('paul');
        
        const paulMessage = `System-Message: Bitte generiere E-Mails für alle Firmen in der Datenbank, welche eine E-Mail-Adresse hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        const paulWorkflowId = await paulChat.sendMessage(paulMessage);
        
        if (!paulWorkflowId) {
          throw new Error('Paul Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ paul_workflow_id: paulWorkflowId })
          .eq('id', pipelineId);

        const paulResult = await waitForWorkflowAndCheckActivity(paulWorkflowId, projectId, 'pitch_paul');
        
        if (paulResult === 'timeout') {
          console.warn('[Pipeline] Paul timed out, but continuing pipeline...');
          toast.warning('Pitch Paul wurde beendet (keine Aktivität), Pipeline läuft weiter');
        } else {
          console.log('[Pipeline] Pitch Paul completed');
        }

        // 2 Minuten Wartezeit vor Britta
        console.log('[Pipeline] Waiting 2 minutes before starting Britta...');
        await new Promise(resolve => setTimeout(resolve, 120000));

        // 5. Trigger Branding Britta via Chat
        console.log('[Pipeline] Starting Branding Britta...');
        setCurrentPhase('britta');

        const brittaMessage = `System-Message: Bitte optimiere alle E-Mails in der Datenbank (Draft und Sent Status). Verbessere Betreffzeilen, Ansprache und Call-to-Actions für maximale Öffnungs- und Klickraten.`;
        const brittaWorkflowId = await brittaChat.sendMessage(brittaMessage);

        if (!brittaWorkflowId) {
          throw new Error('Britta Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ britta_workflow_id: brittaWorkflowId })
          .eq('id', pipelineId);

        const brittaResult = await waitForWorkflowAndCheckActivity(brittaWorkflowId, projectId, 'branding_britta');
        
        if (brittaResult === 'timeout') {
          console.warn('[Pipeline] Britta timed out, but continuing pipeline...');
          toast.warning('Branding Britta wurde beendet (keine Aktivität), Pipeline läuft weiter');
        } else {
          console.log('[Pipeline] Branding Britta completed');
        }

        // 6. Mark pipeline as completed
        await supabase
          .from('automation_pipelines')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            current_phase: null,
          })
          .eq('id', pipelineId);

        setPipelineStatus('completed');
        setCurrentPhase(null);
        setActivePipelineId(null);

        return { pipelineId, status: 'completed' };
      } catch (error) {
        // Update pipeline as failed
        await supabase
          .from('automation_pipelines')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unbekannter Fehler',
            completed_at: new Date().toISOString(),
          })
          .eq('id', pipelineId);

        setPipelineStatus('failed');
        setCurrentPhase(null);
        setActivePipelineId(null);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Automation Pipeline erfolgreich abgeschlossen!');
      queryClient.invalidateQueries({ queryKey: ['active-pipeline', projectId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-states'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: (error: Error) => {
      toast.error(`Pipeline fehlgeschlagen: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ['active-pipeline', projectId] });
    },
  });

  return {
    startPipeline: startPipeline.mutate,
    isRunning: startPipeline.isPending || pipelineStatus === 'running',
    currentPhase,
    pipelineStatus,
    error: startPipeline.error,
  };
};
