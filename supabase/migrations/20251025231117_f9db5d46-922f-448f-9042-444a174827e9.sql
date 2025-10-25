-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  industry TEXT,
  ceo_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  district TEXT,
  city TEXT,
  state TEXT,
  analysis JSONB,
  status public.company_status NOT NULL DEFAULT 'found',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer function to check project access
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.organizations o ON p.organization_id = o.id
    WHERE p.id = _project_id
      AND public.is_organization_member(_user_id, o.id)
  );
$$;

-- RLS Policies for companies

-- Members of the project's organization can view companies
CREATE POLICY "Project members can view companies"
ON public.companies
FOR SELECT
USING (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can create companies
CREATE POLICY "Owner and Manager can create companies"
ON public.companies
FOR INSERT
WITH CHECK (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can update companies
CREATE POLICY "Owner and Manager can update companies"
ON public.companies
FOR UPDATE
USING (public.has_project_access(auth.uid(), project_id));

-- Owner and Manager can delete companies
CREATE POLICY "Owner and Manager can delete companies"
ON public.companies
FOR DELETE
USING (public.has_project_access(auth.uid(), project_id));

-- Create indexes for performance
CREATE INDEX idx_companies_project_id ON public.companies(project_id);
CREATE INDEX idx_companies_email ON public.companies(email);
CREATE INDEX idx_companies_phone ON public.companies(phone);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_city ON public.companies(city);
CREATE INDEX idx_companies_state ON public.companies(state);