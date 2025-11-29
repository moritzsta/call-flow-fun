-- 1. Drop old RLS policies first (they depend on organization_id)
DROP POLICY IF EXISTS "Organization members can view templates" ON email_templates;
DROP POLICY IF EXISTS "Owner and Manager can create templates" ON email_templates;
DROP POLICY IF EXISTS "Owner and Manager can update templates" ON email_templates;
DROP POLICY IF EXISTS "Owner and Manager can delete templates" ON email_templates;

-- 2. Add enum_name column
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS enum_name TEXT NOT NULL DEFAULT 'custom';

-- 3. Now we can remove organization_id column
ALTER TABLE email_templates 
DROP COLUMN organization_id;

-- 4. Create new RLS policies (templates are global for all authenticated users)
CREATE POLICY "Authenticated users can view templates" 
ON email_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create templates" 
ON email_templates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update templates" 
ON email_templates 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete templates" 
ON email_templates 
FOR DELETE 
USING (auth.uid() IS NOT NULL);