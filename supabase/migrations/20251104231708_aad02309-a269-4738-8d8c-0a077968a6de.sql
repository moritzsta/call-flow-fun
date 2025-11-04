-- Remove only TRUE duplicates (same company name AND same address)
-- Keep the entry with most complete data, fallback to oldest entry

WITH ranked_companies AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, company, COALESCE(address, '__NO_ADDRESS__')
      ORDER BY 
        -- Score by completeness
        (CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN analysis IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN ceo_name IS NOT NULL THEN 1 ELSE 0 END) DESC,
        created_at ASC
    ) as rn
  FROM companies
)
DELETE FROM companies c
WHERE c.id IN (
  SELECT id FROM ranked_companies WHERE rn > 1
);

-- Add unique index to prevent future duplicates
-- Uses expression index with COALESCE to handle companies without address
CREATE UNIQUE INDEX companies_project_company_address_unique 
ON companies (project_id, company, COALESCE(address, ''));