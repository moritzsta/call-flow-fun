-- Lösche Duplikate: Behalte jeweils den ältesten Eintrag pro (project_id, company, address)
WITH duplicates AS (
  SELECT 
    project_id, 
    company, 
    address
  FROM public.companies
  WHERE company IS NOT NULL AND address IS NOT NULL
  GROUP BY project_id, company, address
  HAVING COUNT(*) > 1
),
to_keep AS (
  SELECT DISTINCT ON (c.project_id, c.company, c.address) 
    c.id
  FROM public.companies c
  INNER JOIN duplicates d 
    ON c.project_id = d.project_id 
    AND c.company = d.company 
    AND c.address = d.address
  ORDER BY c.project_id, c.company, c.address, c.created_at ASC
)
DELETE FROM public.companies c
WHERE EXISTS (
  SELECT 1 FROM duplicates d 
  WHERE d.project_id = c.project_id 
    AND d.company = c.company 
    AND d.address = c.address
)
AND c.id NOT IN (SELECT id FROM to_keep);

-- Add unique constraint on (project_id, company, address) to prevent duplicates
ALTER TABLE public.companies
ADD CONSTRAINT companies_project_company_address_unique 
UNIQUE (project_id, company, address);