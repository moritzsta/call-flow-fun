-- First: Remove old constraint
ALTER TABLE automation_pipelines 
DROP CONSTRAINT IF EXISTS automation_pipelines_current_phase_check;

-- Second: Update existing data to use full workflow names
UPDATE automation_pipelines 
SET current_phase = CASE current_phase
  WHEN 'felix' THEN 'finder_felix'
  WHEN 'anna' THEN 'analyse_anna_auto'
  WHEN 'paul' THEN 'pitch_paul_auto'
  WHEN 'britta' THEN 'branding_britta_auto'
  ELSE current_phase
END
WHERE current_phase IN ('felix', 'anna', 'paul', 'britta');

-- Third: Add new constraint with full workflow names
ALTER TABLE automation_pipelines 
ADD CONSTRAINT automation_pipelines_current_phase_check 
CHECK (current_phase = ANY (ARRAY[
  'finder_felix'::text, 
  'analyse_anna_auto'::text, 
  'pitch_paul_auto'::text, 
  'branding_britta_auto'::text, 
  'completed'::text
]));