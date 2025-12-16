-- Drop the existing constraint
ALTER TABLE n8n_workflow_states DROP CONSTRAINT IF EXISTS n8n_workflow_states_workflow_name_check;

-- Add updated constraint including update_uwe
ALTER TABLE n8n_workflow_states ADD CONSTRAINT n8n_workflow_states_workflow_name_check 
CHECK (workflow_name IN (
  'finder_felix',
  'analyse_anna', 
  'analyse_anna_auto',
  'pitch_paul',
  'pitch_paul_auto', 
  'branding_britta',
  'branding_britta_auto',
  'sende_susan',
  'sende_susan_single',
  'update_uwe'
));