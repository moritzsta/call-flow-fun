-- Create scheduled_felix_runs table for multi-city search scheduling
CREATE TABLE public.scheduled_felix_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  category TEXT NOT NULL,
  max_companies INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'triggered', 'completed', 'failed')),
  workflow_state_id UUID REFERENCES public.n8n_workflow_states(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_felix_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for project-based access
CREATE POLICY "Project members can view scheduled runs"
  ON public.scheduled_felix_runs
  FOR SELECT
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create scheduled runs"
  ON public.scheduled_felix_runs
  FOR INSERT
  WITH CHECK (has_project_access(auth.uid(), project_id) AND user_id = auth.uid());

CREATE POLICY "Project members can update scheduled runs"
  ON public.scheduled_felix_runs
  FOR UPDATE
  USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can delete scheduled runs"
  ON public.scheduled_felix_runs
  FOR DELETE
  USING (has_project_access(auth.uid(), project_id));

-- Create index for efficient cron queries
CREATE INDEX idx_scheduled_felix_runs_pending ON public.scheduled_felix_runs(scheduled_at) 
  WHERE status = 'pending';

-- Create index for project-based queries
CREATE INDEX idx_scheduled_felix_runs_project ON public.scheduled_felix_runs(project_id);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_felix_runs_updated_at
  BEFORE UPDATE ON public.scheduled_felix_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();