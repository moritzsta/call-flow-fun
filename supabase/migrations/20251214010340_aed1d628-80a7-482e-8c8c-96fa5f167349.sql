-- Drop the existing check constraint that doesn't include _reserving states
ALTER TABLE public.automation_pipelines 
DROP CONSTRAINT IF EXISTS automation_pipelines_current_phase_check;

-- Add new check constraint with all allowed values including _reserving states for atomic reservation
ALTER TABLE public.automation_pipelines 
ADD CONSTRAINT automation_pipelines_current_phase_check 
CHECK (current_phase IS NULL OR current_phase IN (
  'finder_felix', 
  'finder_felix_reserving',
  'analyse_anna_auto', 
  'analyse_anna_auto_reserving',
  'pitch_paul_auto', 
  'pitch_paul_auto_reserving',
  'branding_britta_auto', 
  'branding_britta_auto_reserving',
  'completed'
));