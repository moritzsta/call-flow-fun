-- Create enum for app roles (used in organization_members and user_roles)
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'read_only');

-- Create enum for company status (workflow progression)
CREATE TYPE public.company_status AS ENUM ('found', 'analyzed', 'contacted', 'qualified', 'rejected');

-- Create enum for email status
CREATE TYPE public.email_status AS ENUM ('draft', 'ready_to_send', 'sent', 'failed');

-- Create enum for workflow status (n8n workflow tracking)
CREATE TYPE public.workflow_status AS ENUM ('pending', 'running', 'completed', 'failed');