-- Erweitere CHECK-Constraint für neue Auto-Workflows
ALTER TABLE n8n_workflow_states DROP CONSTRAINT IF EXISTS n8n_workflow_states_workflow_name_check;

ALTER TABLE n8n_workflow_states ADD CONSTRAINT n8n_workflow_states_workflow_name_check 
CHECK (workflow_name IN (
  'finder_felix', 
  'analyse_anna', 
  'analyse_anna_auto', 
  'pitch_paul', 
  'pitch_paul_auto',
  'branding_britta', 
  'branding_britta_auto',
  'email_sender'
));