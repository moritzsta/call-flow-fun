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

  const waitForWorkflowCompletion = (workflowId: string, projectId: string, workflowName?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Anna can take up to 10 hours, use 12h timeout for safety
      const timeoutDuration = workflowName === 'analyse_anna' ? 12 * 60 * 60 * 1000 : 10 * 60 * 1000;
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Workflow-Timeout nach ${timeoutDuration / 60000} Minuten`));
      }, timeoutDuration);

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
            console.log(`[Pipeline] Workflow ${workflowId} status: ${status}`);

            if (status === 'completed') {
              cleanup();
              resolve();
            } else if (status === 'failed') {
              cleanup();
              reject(new Error('Workflow fehlgeschlagen'));
            }
          }
        )
        .subscribe();

      const cleanup = () => {
        clearTimeout(timeout);
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

        await waitForWorkflowCompletion(felixWorkflowId, projectId, 'finder_felix');
        console.log('[Pipeline] Finder Felix completed');

        // 4 Minuten Wartezeit vor Anna
        console.log('[Pipeline] Waiting 4 minutes before starting Anna...');
        await new Promise(resolve => setTimeout(resolve, 240000));

        // 3. Trigger Analyse Anna via Chat
        console.log('[Pipeline] Starting Analyse Anna...');
        setCurrentPhase('anna');
        
        const annaMessage = `System-Message: Bitte analysiere alle Firmen in der Datenbank, welche eine Website-URL hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        const annaWorkflowId = await annaChat.sendMessage(annaMessage);
        
        if (!annaWorkflowId) {
          throw new Error('Anna Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ anna_workflow_id: annaWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(annaWorkflowId, projectId, 'analyse_anna');
        console.log('[Pipeline] Analyse Anna completed');

        // 4 Minuten Wartezeit vor Paul
        console.log('[Pipeline] Waiting 4 minutes before starting Paul...');
        await new Promise(resolve => setTimeout(resolve, 240000));

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

        await waitForWorkflowCompletion(paulWorkflowId, projectId, 'pitch_paul');
        console.log('[Pipeline] Pitch Paul completed');

        // 4 Minuten Wartezeit vor Britta
        console.log('[Pipeline] Waiting 4 minutes before starting Britta...');
        await new Promise(resolve => setTimeout(resolve, 240000));

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

        await waitForWorkflowCompletion(brittaWorkflowId, projectId, 'branding_britta');
        console.log('[Pipeline] Branding Britta completed');

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
