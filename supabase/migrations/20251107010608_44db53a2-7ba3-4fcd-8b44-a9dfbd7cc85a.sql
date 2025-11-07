-- Create automation_pipelines table
CREATE TABLE IF NOT EXISTS public.automation_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  config JSONB NOT NULL,
  felix_workflow_id UUID REFERENCES public.n8n_workflow_states(id),
  anna_workflow_id UUID REFERENCES public.n8n_workflow_states(id),
  paul_workflow_id UUID REFERENCES public.n8n_workflow_states(id),
  current_phase TEXT CHECK (current_phase IN ('felix', 'anna', 'paul')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.automation_pipelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Project members can view pipelines"
  ON public.automation_pipelines
  FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create pipelines"
  ON public.automation_pipelines
  FOR INSERT
  WITH CHECK (has_project_access(auth.uid(), project_id) AND user_id = auth.uid());

CREATE POLICY "Project members can update pipelines"
  ON public.automation_pipelines
  FOR UPDATE
  USING (has_project_access(auth.uid(), project_id));

-- Trigger for updated_at
CREATE TRIGGER update_automation_pipelines_updated_at
  BEFORE UPDATE ON public.automation_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_pipelines;