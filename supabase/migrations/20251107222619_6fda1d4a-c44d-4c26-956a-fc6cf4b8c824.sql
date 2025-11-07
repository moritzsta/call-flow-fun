-- Add britta_workflow_id column to automation_pipelines table
ALTER TABLE automation_pipelines 
ADD COLUMN IF NOT EXISTS britta_workflow_id uuid REFERENCES n8n_workflow_states(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_automation_pipelines_britta_workflow 
ON automation_pipelines(britta_workflow_id);

-- Add comment
COMMENT ON COLUMN automation_pipelines.britta_workflow_id 
IS 'Reference to Branding Britta workflow state';