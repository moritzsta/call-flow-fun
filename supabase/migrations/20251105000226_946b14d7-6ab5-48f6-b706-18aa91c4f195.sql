-- Drop unique index enforcing (project_id, company, COALESCE(address, '')) uniqueness
DROP INDEX IF EXISTS public.companies_project_company_address_unique;