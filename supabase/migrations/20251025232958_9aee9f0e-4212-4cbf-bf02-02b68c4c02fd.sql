-- Enable Realtime for n8n_workflow_states
ALTER TABLE public.n8n_workflow_states REPLICA IDENTITY FULL;

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.n8n_workflow_states;