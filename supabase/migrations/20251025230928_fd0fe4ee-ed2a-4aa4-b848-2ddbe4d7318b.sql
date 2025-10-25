-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'read_only',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create trigger for automatic timestamp updates on organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on organization_members
CREATE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
  );
$$;

-- Create security definer function to check organization role
CREATE OR REPLACE FUNCTION public.has_organization_role(_user_id uuid, _organization_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role = _role
  );
$$;

-- Create security definer function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_organization_owner(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = _organization_id
      AND owner_id = _user_id
  );
$$;

-- RLS Policies for organizations

-- Owner can do everything with their organization
CREATE POLICY "Owners can view their organizations"
ON public.organizations
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their organizations"
ON public.organizations
FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their organizations"
ON public.organizations
FOR DELETE
USING (owner_id = auth.uid());

-- Anyone can create an organization
CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Members can view organizations they belong to
CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT
USING (public.is_organization_member(auth.uid(), id));

-- RLS Policies for organization_members

-- Members can view other members of their organizations
CREATE POLICY "Members can view organization members"
ON public.organization_members
FOR SELECT
USING (public.is_organization_member(auth.uid(), organization_id));

-- Only owners can add members
CREATE POLICY "Owners can add members"
ON public.organization_members
FOR INSERT
WITH CHECK (public.is_organization_owner(auth.uid(), organization_id));

-- Only owners can update member roles
CREATE POLICY "Owners can update member roles"
ON public.organization_members
FOR UPDATE
USING (public.is_organization_owner(auth.uid(), organization_id));

-- Only owners can remove members
CREATE POLICY "Owners can remove members"
ON public.organization_members
FOR DELETE
USING (public.is_organization_owner(auth.uid(), organization_id));

-- Create indexes for performance
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);