
-- 1. Demo-Auth-User anlegen (mit fester ID, falls nicht vorhanden)
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
  email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000d3a',
  'authenticated', 'authenticated', 'demo@demo.local',
  crypt('not-used-' || gen_random_uuid()::text, gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo User"}'::jsonb,
  false, '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Demo-Organisation
INSERT INTO public.organizations (id, name, owner_id, description)
VALUES (
  '00000000-0000-0000-0000-000000000d30',
  'Demo Organisation',
  '00000000-0000-0000-0000-000000000d3a',
  'Öffentliches Demo für die Landingpage'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Demo-Projekt
INSERT INTO public.projects (id, organization_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000d31',
  '00000000-0000-0000-0000-000000000d30',
  'Demo-Projekt (Landingpage)',
  'Wird vor jedem Demo-Lauf zurückgesetzt. Maximal 10 Firmen.'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Public SELECT policies (nur Demo-Projekt)
DROP POLICY IF EXISTS "Public can view demo organization" ON public.organizations;
CREATE POLICY "Public can view demo organization"
  ON public.organizations FOR SELECT
  USING (id = '00000000-0000-0000-0000-000000000d30');

DROP POLICY IF EXISTS "Public can view demo project" ON public.projects;
CREATE POLICY "Public can view demo project"
  ON public.projects FOR SELECT
  USING (id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo companies" ON public.companies;
CREATE POLICY "Public can view demo companies"
  ON public.companies FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo emails" ON public.project_emails;
CREATE POLICY "Public can view demo emails"
  ON public.project_emails FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo workflow states" ON public.n8n_workflow_states;
CREATE POLICY "Public can view demo workflow states"
  ON public.n8n_workflow_states FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can view demo workflow messages" ON public.workflow_messages;
CREATE POLICY "Public can view demo workflow messages"
  ON public.workflow_messages FOR SELECT
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

-- 5. Public INSERT für n8n_workflow_states (nur Demo-Projekt)
DROP POLICY IF EXISTS "Public can insert demo workflow states" ON public.n8n_workflow_states;
CREATE POLICY "Public can insert demo workflow states"
  ON public.n8n_workflow_states FOR INSERT
  WITH CHECK (
    project_id = '00000000-0000-0000-0000-000000000d31'
    AND user_id = '00000000-0000-0000-0000-000000000d3a'
  );

-- 6. Public DELETE für Demo-Reset
DROP POLICY IF EXISTS "Public can reset demo companies" ON public.companies;
CREATE POLICY "Public can reset demo companies"
  ON public.companies FOR DELETE
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can reset demo emails" ON public.project_emails;
CREATE POLICY "Public can reset demo emails"
  ON public.project_emails FOR DELETE
  USING (project_id = '00000000-0000-0000-0000-000000000d31');

DROP POLICY IF EXISTS "Public can reset demo workflow states" ON public.n8n_workflow_states;
CREATE POLICY "Public can reset demo workflow states"
  ON public.n8n_workflow_states FOR DELETE
  USING (project_id = '00000000-0000-0000-0000-000000000d31');
