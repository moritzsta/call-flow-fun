import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkflowChat } from './useWorkflowChat';
import { toast } from 'sonner';

type PipelinePhase = 'finder_felix' | 'analyse_anna_auto' | 'pitch_paul_auto' | 'branding_britta_auto' | 'completed';
type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed';

interface PipelineConfig {
  projectId: string;
  userId: string;
  searchCriteria: {
    state?: string;
    city?: string;
    district?: string;
    category?: string;
    vorhaben?: string;
  };
}

interface StartPipelineParams {
  config: PipelineConfig;
}

export function useAutomatedPipeline(projectId: string) {
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('pending');
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

  // Initialize chat for Finder Felix
  const felixChat = useWorkflowChat({
    workflowName: 'finder_felix',
    projectId,
  });

  // Fetch existing running pipeline
  const { data: existingPipeline, refetch: refetchPipeline } = useQuery({
    queryKey: ['automation-pipeline', projectId],
    queryFn: async () => {
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
  });

  // Restore state from existing pipeline
  useEffect(() => {
    if (existingPipeline) {
      setActivePipelineId(existingPipeline.id);
      setCurrentPhase(existingPipeline.current_phase as PipelinePhase);
      setPipelineStatus(existingPipeline.status as PipelineStatus);
    }
  }, [existingPipeline]);

  // Subscribe to pipeline updates via Realtime
  useEffect(() => {
    if (!activePipelineId) return;

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
          console.log('Pipeline updated via Realtime:', payload);
          const newData = payload.new as any;
          setCurrentPhase(newData.current_phase as PipelinePhase);
          setPipelineStatus(newData.status as PipelineStatus);
          
          if (newData.status === 'completed') {
            toast.success('Automatisierte Pipeline abgeschlossen');
          } else if (newData.status === 'failed') {
            toast.error('Pipeline fehlgeschlagen');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePipelineId]);

  const startPipeline = useMutation({
    mutationFn: async ({ config }: StartPipelineParams) => {
      console.log('Starting automated pipeline...');

      // Create pipeline record
      const { data: pipeline, error: pipelineError } = await supabase
        .from('automation_pipelines')
        .insert({
          project_id: config.projectId,
          user_id: config.userId,
          status: 'running',
          current_phase: 'finder_felix',
          config: config.searchCriteria,
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      console.log('Pipeline created:', pipeline.id);
      setActivePipelineId(pipeline.id);
      setCurrentPhase('finder_felix');
      setPipelineStatus('running');

      // Build search message for Finder Felix
      const searchTerms = [];
      if (config.searchCriteria.state) searchTerms.push(`Bundesland: ${config.searchCriteria.state}`);
      if (config.searchCriteria.city) searchTerms.push(`Stadt: ${config.searchCriteria.city}`);
      if (config.searchCriteria.district) searchTerms.push(`Bezirk: ${config.searchCriteria.district}`);
      if (config.searchCriteria.category) searchTerms.push(`Branche: ${config.searchCriteria.category}`);

      const felixMessage = searchTerms.length > 0
        ? `Bitte finde Unternehmen mit folgenden Kriterien: ${searchTerms.join(', ')}`
        : 'Bitte finde Unternehmen';

      console.log('Starting Finder Felix with message:', felixMessage);

      // Start Finder Felix via chat - this creates a workflow_state internally
      const felixWorkflowId = await felixChat.sendMessage(felixMessage);
      
      if (!felixWorkflowId) {
        throw new Error('Failed to start Finder Felix workflow');
      }

      console.log('Finder Felix started with workflow_id:', felixWorkflowId);

      // Update pipeline with Felix workflow_id AND set pipeline_id on the workflow_state
      // This creates the explicit link between workflow and pipeline
      await supabase
        .from('automation_pipelines')
        .update({ felix_workflow_id: felixWorkflowId })
        .eq('id', pipeline.id);

      // WICHTIG: Set pipeline_id on the workflow_state for explicit context tracking
      await supabase
        .from('n8n_workflow_states')
        .update({ pipeline_id: pipeline.id })
        .eq('id', felixWorkflowId);

      toast.success('Pipeline gestartet - Finder Felix läuft');

      return {
        pipelineId: pipeline.id,
        felixWorkflowId,
      };
    },
    onSuccess: () => {
      refetchPipeline();
    },
    onError: (error: Error) => {
      console.error('Pipeline error:', error);
      setPipelineStatus('failed');
      toast.error(`Pipeline-Fehler: ${error.message}`);
    },
  });

  return {
    startPipeline: startPipeline.mutate,
    isRunning: pipelineStatus === 'running',
    currentPhase,
    pipelineStatus,
    error: startPipeline.error,
  };
}
