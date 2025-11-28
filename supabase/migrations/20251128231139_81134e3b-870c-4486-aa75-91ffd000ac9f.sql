-- 1. Bestehende Duplikate bereinigen (basierend auf project_id, company, phone)
-- Behält den ältesten Eintrag (kleinste ID) und löscht neuere Duplikate
DELETE FROM companies a
USING companies b
WHERE a.id > b.id 
  AND a.project_id = b.project_id 
  AND a.company = b.company 
  AND COALESCE(a.phone, '') = COALESCE(b.phone, '');

-- 2. Alten Constraint entfernen (erst Constraint, dann Index)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_project_company_address_unique;

-- 3. Neuen Unique Index mit COALESCE(phone, '') erstellen
CREATE UNIQUE INDEX companies_project_company_phone_unique 
ON companies (project_id, company, COALESCE(phone, ''));