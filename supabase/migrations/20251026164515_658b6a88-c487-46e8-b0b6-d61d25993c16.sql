-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Organization members can view templates
CREATE POLICY "Organization members can view templates"
ON public.email_templates
FOR SELECT
USING (is_organization_member(auth.uid(), organization_id));

-- Owner and Manager can create templates
CREATE POLICY "Owner and Manager can create templates"
ON public.email_templates
FOR INSERT
WITH CHECK (
  has_organization_role(auth.uid(), organization_id, 'owner'::app_role) OR
  has_organization_role(auth.uid(), organization_id, 'manager'::app_role)
);

-- Owner and Manager can update templates
CREATE POLICY "Owner and Manager can update templates"
ON public.email_templates
FOR UPDATE
USING (
  has_organization_role(auth.uid(), organization_id, 'owner'::app_role) OR
  has_organization_role(auth.uid(), organization_id, 'manager'::app_role)
);

-- Owner and Manager can delete templates
CREATE POLICY "Owner and Manager can delete templates"
ON public.email_templates
FOR DELETE
USING (
  has_organization_role(auth.uid(), organization_id, 'owner'::app_role) OR
  has_organization_role(auth.uid(), organization_id, 'manager'::app_role)
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_email_templates_organization_id ON public.email_templates(organization_id);