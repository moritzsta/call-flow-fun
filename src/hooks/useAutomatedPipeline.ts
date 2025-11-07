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

  const brittaChat = useWorkflowChat({
    workflowName: 'branding_britta',
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
        
        const felixMessage = `🤖 Automatisch: Suche mir bitte alle Firmen zur Kategorie "${config.category}" in der Stadt ${config.city}, ${config.state}${config.maxCompanies ? `. Begrenze deine Suche auf ${config.maxCompanies} Firmen` : ''}`;
        const felixWorkflowId = await felixChat.sendMessage(felixMessage);
        
        if (!felixWorkflowId) {
          throw new Error('Felix Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ felix_workflow_id: felixWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(felixWorkflowId, projectId);
        console.log('[Pipeline] Finder Felix completed');

        // 3. Trigger Analyse Anna via Chat
        console.log('[Pipeline] Starting Analyse Anna...');
        setCurrentPhase('anna');
        
        const annaMessage = `🤖 Automatisch: Bitte analysiere alle Firmen in der Datenbank, welche eine Website-URL hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        const annaWorkflowId = await annaChat.sendMessage(annaMessage);
        
        if (!annaWorkflowId) {
          throw new Error('Anna Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ anna_workflow_id: annaWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(annaWorkflowId, projectId);
        console.log('[Pipeline] Analyse Anna completed');

        // 4. Trigger Pitch Paul via Chat
        console.log('[Pipeline] Starting Pitch Paul...');
        setCurrentPhase('paul');
        
        const paulMessage = `🤖 Automatisch: Bitte generiere E-Mails für alle Firmen in der Datenbank, welche eine E-Mail-Adresse hinterlegt haben. Mein Vorhaben: ${config.vorhaben}`;
        const paulWorkflowId = await paulChat.sendMessage(paulMessage);
        
        if (!paulWorkflowId) {
          throw new Error('Paul Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ paul_workflow_id: paulWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(paulWorkflowId, projectId);
        console.log('[Pipeline] Pitch Paul completed');

        // 5. Trigger Branding Britta via Chat
        console.log('[Pipeline] Starting Branding Britta...');
        setCurrentPhase('britta');

        const brittaMessage = `🤖 Automatisch: Bitte optimiere alle E-Mails in der Datenbank (Draft und Sent Status). Verbessere Betreffzeilen, Ansprache und Call-to-Actions für maximale Öffnungs- und Klickraten.`;
        const brittaWorkflowId = await brittaChat.sendMessage(brittaMessage);

        if (!brittaWorkflowId) {
          throw new Error('Britta Workflow-State konnte nicht erstellt werden');
        }

        await supabase
          .from('automation_pipelines')
          .update({ britta_workflow_id: brittaWorkflowId })
          .eq('id', pipelineId);

        await waitForWorkflowCompletion(brittaWorkflowId, projectId);
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
