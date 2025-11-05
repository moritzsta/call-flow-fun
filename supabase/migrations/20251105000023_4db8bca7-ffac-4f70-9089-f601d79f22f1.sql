-- Remove unique constraint that prevents duplicate companies
-- Duplicates are now handled in the n8n workflow instead
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_project_company_address_unique;