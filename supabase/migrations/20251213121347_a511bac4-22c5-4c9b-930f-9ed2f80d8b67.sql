-- Add pipeline_id column to n8n_workflow_states for explicit Pipeline vs. Standalone differentiation
ALTER TABLE public.n8n_workflow_states 
ADD COLUMN pipeline_id uuid REFERENCES public.automation_pipelines(id) ON DELETE SET NULL;

-- Create index for faster pipeline lookups
CREATE INDEX idx_workflow_states_pipeline_id ON public.n8n_workflow_states(pipeline_id);

-- Comment for documentation
COMMENT ON COLUMN public.n8n_workflow_states.pipeline_id IS 'References the automation pipeline if this workflow is part of an automated pipeline. NULL for standalone/single auto-modules and chat workflows.';