import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowTrigger } from './useWorkflowTrigger';
import { toast } from 'sonner';

interface PipelineConfig {
  city: string;
  state: string;
  category: string;
  vorhaben: string;
}

interface StartPipelineParams {
  projectId: string;
  userId: string;
  config: PipelineConfig;
}

type PipelinePhase = 'felix' | 'anna' | 'paul';
type PipelineStatus = 'idle' | 'running' | 'completed' | 'failed';

export const useAutomatedPipeline = () => {
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');
  const { triggerWorkflow } = useWorkflowTrigger();
  const queryClient = useQueryClient();

  const waitForWorkflowCompletion = (workflowId: string, projectId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Workflow-Timeout nach 10 Minuten'));
      }, 10 * 60 * 1000); // 10 minutes timeout

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

      try {
        // 2. Trigger Finder Felix
        console.log('[Pipeline] Starting Finder Felix...');
        setCurrentPhase('felix');
        
        const felixMessage = `Suche mir bitte alle Firmen zur Kategorie "${config.category}" in der Stadt ${config.city}, ${config.state}`;
        
        const felixPromise = new Promise<string>((resolve, reject) => {
          triggerWorkflow(
            {
              workflowName: 'finder_felix',
              projectId,
              userId,
              triggerData: { user_message: felixMessage },
            },
            {
              onSuccess: (data) => resolve(data.workflow_id),
              onError: (error) => reject(error),
            }
          );
        });

        const felixWorkflowId = await felixPromise;
        
        await supabase
          .from('automation_pipelines')
          .update({ felix_workflow_id: felixWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(felixWorkflowId, projectId);
        console.log('[Pipeline] Finder Felix completed');

        // 3. Trigger Analyse Anna
        console.log('[Pipeline] Starting Analyse Anna...');
        setCurrentPhase('anna');
        
        const annaMessage = `Bitte analysiere alle Firmen in der Datenbank, welche eine Website-URL hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        
        const annaPromise = new Promise<string>((resolve, reject) => {
          triggerWorkflow(
            {
              workflowName: 'analyse_anna',
              projectId,
              userId,
              triggerData: { user_message: annaMessage },
            },
            {
              onSuccess: (data) => resolve(data.workflow_id),
              onError: (error) => reject(error),
            }
          );
        });

        const annaWorkflowId = await annaPromise;
        
        await supabase
          .from('automation_pipelines')
          .update({ anna_workflow_id: annaWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(annaWorkflowId, projectId);
        console.log('[Pipeline] Analyse Anna completed');

        // 4. Trigger Pitch Paul
        console.log('[Pipeline] Starting Pitch Paul...');
        setCurrentPhase('paul');
        
        const paulMessage = `Bitte generiere E-Mails für alle Firmen in der Datenbank, welche eine E-Mail-Adresse hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        
        const paulPromise = new Promise<string>((resolve, reject) => {
          triggerWorkflow(
            {
              workflowName: 'pitch_paul',
              projectId,
              userId,
              triggerData: { user_message: paulMessage },
            },
            {
              onSuccess: (data) => resolve(data.workflow_id),
              onError: (error) => reject(error),
            }
          );
        });

        const paulWorkflowId = await paulPromise;
        
        await supabase
          .from('automation_pipelines')
          .update({ paul_workflow_id: paulWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(paulWorkflowId, projectId);
        console.log('[Pipeline] Pitch Paul completed');

        // 5. Mark pipeline as completed
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
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Automation Pipeline erfolgreich abgeschlossen!');
      queryClient.invalidateQueries({ queryKey: ['workflow-states'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onError: (error: Error) => {
      toast.error(`Pipeline fehlgeschlagen: ${error.message}`);
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
