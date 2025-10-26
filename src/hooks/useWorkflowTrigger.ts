import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  notifyWorkflowStarted, 
  notifyWorkflowError 
} from '@/lib/notifications';

interface TriggerWorkflowParams {
  workflowName: 'finder_felix' | 'analyse_anna' | 'pitch_paul' | 'email_sender';
  projectId: string;
  userId: string;
  triggerData: Record<string, any>;
}

interface WorkflowResponse {
  workflow_id: string;
  status: string;
  message?: string;
}

export const useWorkflowTrigger = () => {
  const triggerWorkflow = useMutation({
    mutationFn: async ({ workflowName, projectId, userId, triggerData }: TriggerWorkflowParams) => {
      // 1. Create workflow state in DB (status: pending)
      const { data: workflowState, error: dbError } = await supabase
        .from('n8n_workflow_states')
        .insert({
          project_id: projectId,
          user_id: userId,
          workflow_name: workflowName,
          status: 'pending',
          trigger_data: triggerData,
        })
        .select()
        .single();

      if (dbError) throw new Error(`DB Error: ${dbError.message}`);
      if (!workflowState) throw new Error('Failed to create workflow state');

      // 2. Call n8n webhook via Edge Function
      const { data: webhookResponse, error: functionError } = await supabase.functions.invoke(
        'trigger-n8n-workflow',
        {
          body: {
            workflow_name: workflowName,
            workflow_id: workflowState.id,
            project_id: projectId,
            user_id: userId,
            trigger_data: triggerData,
          },
        }
      );

      if (functionError) {
        // Update workflow state to failed
        await supabase
          .from('n8n_workflow_states')
          .update({ status: 'failed', result_summary: { error: functionError.message } })
          .eq('id', workflowState.id);

        throw new Error(`Webhook Error: ${functionError.message}`);
      }

      // 3. Update workflow state to running
      await supabase
        .from('n8n_workflow_states')
        .update({ status: 'running' })
        .eq('id', workflowState.id);

      return {
        workflow_id: workflowState.id,
        status: 'running',
        ...webhookResponse,
      } as WorkflowResponse;
    },
    onSuccess: (data) => {
      notifyWorkflowStarted(data.workflow_id);
    },
    onError: (error: Error) => {
      notifyWorkflowError(error.message);
    },
  });

  return {
    triggerWorkflow: triggerWorkflow.mutate,
    isTriggering: triggerWorkflow.isPending,
    error: triggerWorkflow.error,
  };
};
