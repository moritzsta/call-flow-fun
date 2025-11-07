-- Drop the old check constraint
ALTER TABLE public.n8n_workflow_states 
DROP CONSTRAINT IF EXISTS n8n_workflow_states_workflow_name_check;

-- Add the new check constraint including branding_britta
ALTER TABLE public.n8n_workflow_states 
ADD CONSTRAINT n8n_workflow_states_workflow_name_check 
CHECK (workflow_name IN ('finder_felix', 'analyse_anna', 'pitch_paul', 'branding_britta', 'email_sender'));