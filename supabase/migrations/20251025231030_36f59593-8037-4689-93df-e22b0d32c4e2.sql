-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for projects

-- Members of the organization can view projects
CREATE POLICY "Organization members can view projects"
ON public.projects
FOR SELECT
USING (public.is_organization_member(auth.uid(), organization_id));

-- Owner and Manager can create projects
CREATE POLICY "Owner and Manager can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  public.has_organization_role(auth.uid(), organization_id, 'owner')
  OR public.has_organization_role(auth.uid(), organization_id, 'manager')
);

-- Owner and Manager can update projects
CREATE POLICY "Owner and Manager can update projects"
ON public.projects
FOR UPDATE
USING (
  public.has_organization_role(auth.uid(), organization_id, 'owner')
  OR public.has_organization_role(auth.uid(), organization_id, 'manager')
);

-- Owner and Manager can delete projects
CREATE POLICY "Owner and Manager can delete projects"
ON public.projects
FOR DELETE
USING (
  public.has_organization_role(auth.uid(), organization_id, 'owner')
  OR public.has_organization_role(auth.uid(), organization_id, 'manager')
);

-- Create indexes for performance
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_projects_archived ON public.projects(archived);