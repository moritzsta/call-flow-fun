-- Create n8n_workflow_states table
CREATE TABLE public.n8n_workflow_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL CHECK (workflow_name IN ('finder_felix', 'analyse_anna', 'pitch_paul', 'email_sender')),
  status public.workflow_status NOT NULL DEFAULT 'pending',
  trigger_data JSONB,
  result_summary JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.n8n_workflow_states ENABLE ROW LEVEL SECURITY;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_n8n_workflow_states_updated_at
BEFORE UPDATE ON public.n8n_workflow_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for n8n_workflow_states

-- Members of the project's organization can view workflow states
CREATE POLICY "Project members can view workflow states"
ON public.n8n_workflow_states
FOR SELECT
USING (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can create workflow states
CREATE POLICY "Owner and Manager can create workflow states"
ON public.n8n_workflow_states
FOR INSERT
WITH CHECK (public.has_project_access(auth.uid(), project_id) AND user_id = auth.uid());

-- Owner and Manager can update workflow states
CREATE POLICY "Owner and Manager can update workflow states"
ON public.n8n_workflow_states
FOR UPDATE
USING (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can delete workflow states
CREATE POLICY "Owner and Manager can delete workflow states"
ON public.n8n_workflow_states
FOR DELETE
USING (public.has_project_access(auth.uid(), project_id));

-- Create indexes for performance
CREATE INDEX idx_n8n_workflow_states_project_id ON public.n8n_workflow_states(project_id);
CREATE INDEX idx_n8n_workflow_states_workflow_name ON public.n8n_workflow_states(workflow_name);
CREATE INDEX idx_n8n_workflow_states_status ON public.n8n_workflow_states(status);
CREATE INDEX idx_n8n_workflow_states_user_id ON public.n8n_workflow_states(user_id);