-- Add loop_count column to n8n_workflow_states table
ALTER TABLE public.n8n_workflow_states
ADD COLUMN loop_count integer NOT NULL DEFAULT 0;