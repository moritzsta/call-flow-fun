-- ============================================================
-- DEMO-MODUS für Landingpage
-- Auf der LOKALEN Supabase-Instanz im Schema `projekt_b` ausführen!
-- ============================================================

SET search_path TO projekt_b;

-- Feste Demo-IDs
-- Demo Org:  00000000-0000-0000-0000-000000000d30
-- Demo Proj: 00000000-0000-0000-0000-000000000d31
-- Demo User: 34fc522c-4c10-463b-b8d4-8625d1476eda (DUMMY-UUID, kein echter auth.users-Eintrag nötig)

-- 1. Demo-Organisation anlegen
-- Falls owner_id eine FK auf auth.users hat, brauchen wir einen Demo-Auth-User.
-- Variante A: Echten Auth-User in deiner lokalen Instanz anlegen (empfohlen)
--   → Über Supabase Studio → Authentication → Add User
--   → Email: demo@demo.local, Passwort: irgendwas
--   → Dann hier UUID einsetzen statt der Dummy-UUID
-- Variante B: FK temporär lockern (NICHT empfohlen)

-- Hier die manuelle Variante: ersetze <DEMO_USER_UUID> mit der UUID des angelegten Demo-Users
-- ODER lass die Dummy-UUID, falls owner_id KEINEN FK auf auth.users hat

INSERT INTO organizations (id, name, owner_id, description)
VALUES (
  '00000000-0000-0000-0000-000000000d30',
  'Demo Organisation',
  '34fc522c-4c10-463b-b8d4-8625d1476eda',  -- ggf. durch echten Demo-User ersetzen
  'Öffentliches Demo für die Landingpage'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Demo-Projekt anlegen
INSERT INTO projects (id, organization_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000d31',
  '00000000-0000-0000-0000-000000000d30',
  'Demo-Projekt (Landingpage)',
  'Wird vor jedem Demo-Lauf zurückgesetzt. Maximal 10 Firmen.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Public-Read-Policies (NUR für Demo-Projekt)
DROP POLICY IF EXISTS "Public can view demo organization" ON organizations;
CREATE POLICY "Public can view demo organization"
  ON organizations FOR SELECT
  USING (id = '00000000-0000-0000-0000-000000000d30');

DROP POLICY IF EXISTS "Public can view demo project" ON projects;
CREATE POLICY "Public can view demo project"
  ON projects FOR SELECT
  USING (id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo companies" ON companies;
CREATE POLICY "Public can view demo companies"
  ON companies FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo emails" ON project_emails;
CREATE POLICY "Public can view demo emails"
  ON project_emails FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo workflow states" ON n8n_workflow_states;
CREATE POLICY "Public can view demo workflow states"
  ON n8n_workflow_states FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo workflow messages" ON workflow_messages;
CREATE POLICY "Public can view demo workflow messages"
  ON workflow_messages FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

-- 4. Public-INSERT für Workflow-Trigger (NUR Demo-Projekt, NUR Demo-User-ID)
DROP POLICY IF EXISTS "Public can insert demo workflow states" ON n8n_workflow_states;
CREATE POLICY "Public can insert demo workflow states"
  ON n8n_workflow_states FOR INSERT
  WITH CHECK (
    project_id = '00000000-0000-0000-0000-000000000d31'
    AND user_id = '34fc522c-4c10-463b-b8d4-8625d1476eda'
  );

-- 5. Public-DELETE für Demo-Reset (löscht alle Firmen/Emails/Workflows des Demo-Projekts)
DROP POLICY IF EXISTS "Public can reset demo companies" ON companies;
CREATE POLICY "Public can reset demo companies"
  ON companies FOR DELETE
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can reset demo emails" ON project_emails;
CREATE POLICY "Public can reset demo emails"
  ON project_emails FOR DELETE
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can reset demo workflow states" ON n8n_workflow_states;
CREATE POLICY "Public can reset demo workflow states"
  ON n8n_workflow_states FOR DELETE
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

-- ============================================================
-- Fertig. Die Landingpage-Demo kann jetzt:
--   - Das Demo-Projekt lesen
--   - Workflow-States anlegen (nur für Demo-Projekt)
--   - Vor jedem Lauf alte Daten löschen
-- Alle anderen Projekte bleiben unverändert privat.
-- ============================================================
