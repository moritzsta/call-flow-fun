import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowChat } from './useWorkflowChat';
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

export const useAutomatedPipeline = (projectId?: string) => {
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');
  const queryClient = useQueryClient();

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
        // 2. Trigger Finder Felix via Chat
        console.log('[Pipeline] Starting Finder Felix...');
        setCurrentPhase('felix');
        
        const felixMessage = `🤖 Automatisch: Suche mir bitte alle Firmen zur Kategorie "${config.category}" in der Stadt ${config.city}, ${config.state}`;
        await felixChat.sendMessage(felixMessage);

        // Wait for workflow state to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!felixChat.workflowStateId) {
          throw new Error('Felix Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ felix_workflow_id: felixChat.workflowStateId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(felixChat.workflowStateId, projectId);
        console.log('[Pipeline] Finder Felix completed');

        // 3. Trigger Analyse Anna via Chat
        console.log('[Pipeline] Starting Analyse Anna...');
        setCurrentPhase('anna');
        
        const annaMessage = `🤖 Automatisch: Bitte analysiere alle Firmen in der Datenbank, welche eine Website-URL hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        await annaChat.sendMessage(annaMessage);

        // Wait for workflow state to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!annaChat.workflowStateId) {
          throw new Error('Anna Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ anna_workflow_id: annaChat.workflowStateId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(annaChat.workflowStateId, projectId);
        console.log('[Pipeline] Analyse Anna completed');

        // 4. Trigger Pitch Paul via Chat
        console.log('[Pipeline] Starting Pitch Paul...');
        setCurrentPhase('paul');
        
        const paulMessage = `🤖 Automatisch: Bitte generiere E-Mails für alle Firmen in der Datenbank, welche eine E-Mail-Adresse hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        await paulChat.sendMessage(paulMessage);

        // Wait for workflow state to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!paulChat.workflowStateId) {
          throw new Error('Paul Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ paul_workflow_id: paulChat.workflowStateId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(paulChat.workflowStateId, projectId);
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
