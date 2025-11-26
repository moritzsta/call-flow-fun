-- Drop the existing constraint
ALTER TABLE n8n_workflow_states 
DROP CONSTRAINT n8n_workflow_states_workflow_name_check;

-- Add new constraint with analyse_anna_auto included
ALTER TABLE n8n_workflow_states 
ADD CONSTRAINT n8n_workflow_states_workflow_name_check 
CHECK (workflow_name = ANY (ARRAY[
  'finder_felix'::text, 
  'analyse_anna'::text, 
  'analyse_anna_auto'::text,
  'pitch_paul'::text, 
  'branding_britta'::text, 
  'email_sender'::text
]));