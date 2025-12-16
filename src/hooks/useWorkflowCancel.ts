import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWorkflowCancel = () => {
  const [isCancelling, setIsCancelling] = useState(false);
  const queryClient = useQueryClient();

  const cancelWorkflow = async (workflowId: string, workflowName: string) => {
    setIsCancelling(true);
    
    try {
      const { error } = await supabase
        .from('n8n_workflow_states')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', workflowId);

      if (error) throw error;

      // Invalidate all related queries to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['workflow-state', workflowId] });
      await queryClient.invalidateQueries({ queryKey: ['single-workflow-status'] });

      toast.success(`Workflow "${workflowName}" wurde abgebrochen`, {
        description: 'Der Workflow wurde als fehlgeschlagen markiert.',
      });
    } catch (error: any) {
      console.error('Error cancelling workflow:', error);
      toast.error('Fehler beim Abbrechen', {
        description: error.message,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return { cancelWorkflow, isCancelling };
};
