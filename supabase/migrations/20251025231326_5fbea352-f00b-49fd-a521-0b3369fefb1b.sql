-- Create project_emails table
CREATE TABLE public.project_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status public.email_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_emails ENABLE ROW LEVEL SECURITY;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_emails_updated_at
BEFORE UPDATE ON public.project_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for project_emails

-- Members of the project's organization can view emails
CREATE POLICY "Project members can view emails"
ON public.project_emails
FOR SELECT
USING (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can create emails
CREATE POLICY "Owner and Manager can create emails"
ON public.project_emails
FOR INSERT
WITH CHECK (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can update emails
CREATE POLICY "Owner and Manager can update emails"
ON public.project_emails
FOR UPDATE
USING (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can delete emails
CREATE POLICY "Owner and Manager can delete emails"
ON public.project_emails
FOR DELETE
USING (public.has_project_access(auth.uid(), project_id));

-- Create indexes for performance
CREATE INDEX idx_project_emails_project_id ON public.project_emails(project_id);
CREATE INDEX idx_project_emails_company_id ON public.project_emails(company_id);
CREATE INDEX idx_project_emails_status ON public.project_emails(status);
CREATE INDEX idx_project_emails_sent_at ON public.project_emails(sent_at);