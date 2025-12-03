-- Drop the existing constraint and recreate with sende_susan
ALTER TABLE n8n_workflow_states 
DROP CONSTRAINT IF EXISTS n8n_workflow_states_workflow_name_check;

ALTER TABLE n8n_workflow_states 
ADD CONSTRAINT n8n_workflow_states_workflow_name_check 
CHECK (workflow_name IN ('finder_felix', 'analyse_anna', 'pitch_paul', 'branding_britta', 'finder_felix_auto', 'analyse_anna_auto', 'pitch_paul_auto', 'branding_britta_auto', 'sende_susan'));