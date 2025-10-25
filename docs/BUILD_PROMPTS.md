# BUILD_PROMPTS.md – Cold Calling App

**Projekt**: Cold Calling Automatisierungs-Plattform  
**Stack**: Lovable (React, Vite, Tailwind), Supabase (externe Datenbank), n8n Workflows  
**Version**: 1.0  
**Stand**: 2025-10-25

---

## 🎯 Projektübersicht

Cold Calling ist eine Plattform zur Automatisierung der Kaltakquise im Sales-Bereich. Die App orchestriert drei KI-gestützte n8n-Workflows:
- **Finder Felix**: Webscraping für Firmendaten (Gelbe Seiten)
- **Analyse Anna**: KI-basierte Webseitenanalyse (Firecrawl + GPT)
- **Pitch Paul**: Personalisierte E-Mail-Generierung (GPT-4)

Die Anwendung unterstützt Team-Kollaboration mit Organisationen, Projekten und Rollen-Management.

---

## 📋 Themenbereiche & Task-Überblick

| Phase | Task-Bereich | IDs |
|-------|--------------|-----|
| **Setup** | Repository & Dependencies | 001-002 |
| **Backend** | Datenbank & RLS | 003-012 |
| **Auth** | Authentifizierung & Profile | 013-016 |
| **Org/Projekt** | Organisationen & Projekte | 017-022 |
| **Workflows** | n8n Webhook-Integration | 023-028 |
| **Core Features** | Firmen- & E-Mail-Management | 029-036 |
| **UI/UX** | Design System & Pages | 037-048 |
| **Polish** | Testing & Deployment | 049-052 |

---

## 001 Repository Setup & Projektstruktur

**Ziel**: Projektstruktur einrichten, Dependencies installieren, bestehende Supabase-Datenbank nutzen.

**ToDo**:
- ✅ Bestehende Supabase-Datenbank ist bereits verbunden (externe Supabase-Instanz)
- Projektstruktur planen: `src/components/`, `src/hooks/`, `src/lib/`
- Package.json prüfen und ggf. ergänzen: `@supabase/supabase-js`, `@tanstack/react-query`, `zod`
- `.env`-Vorlage dokumentieren (für lokale Entwicklung, falls nötig)

**Output**:
- Bestehende Supabase-Datenbank ist verbunden und nutzbar
- Dokumentierte Projektstruktur in `docs/PROJECT_STRUCTURE.md`

**Checks**:
- [x] Supabase-Datenbank ist verbunden (externe Instanz)
- [x] Supabase-Credentials sind verfügbar
- [ ] Dependencies sind installiert

**Weiter**: 002

---

## 002 Environment & Secrets Setup

**Ziel**: Secrets für n8n-Webhooks und KI-APIs konfigurieren.

**ToDo**:
- Secrets in Supabase konfigurieren:
  - `N8N_WEBHOOK_BASE_URL` (z.B. `https://your-n8n.app`)
  - `N8N_WEBHOOK_SECRET` (für Signature Verification)
  - `OPENAI_API_KEY` (falls direkt genutzt, sonst n8n managed)
- Dokumentiere Webhook-URLs in `docs/N8N_WEBHOOKS.md`

**Output**:
- Secrets in Supabase konfiguriert
- `docs/N8N_WEBHOOKS.md` mit Webhook-Endpunkten

**Checks**:
- [ ] Alle Secrets sind gesetzt
- [ ] Webhook-URLs sind dokumentiert

**Weiter**: 003

📘 Reuse: feature/03-security-pattern

---

## 003 Datenbank-Schema: Enums & Base Types

**Ziel**: Enums und Basis-Typen in Supabase erstellen.

**ToDo**:
- Erstelle Enum `app_role`: `'owner', 'manager', 'read_only'`
- Erstelle Enum `company_status`: `'found', 'analyzed', 'contacted', 'qualified', 'rejected'`
- Erstelle Enum `email_status`: `'draft', 'ready_to_send', 'sent', 'failed'`
- Erstelle Enum `workflow_status`: `'pending', 'running', 'completed', 'failed'`

**Output**:
- SQL Migration: `supabase/migrations/YYYYMMDD_create_enums.sql`

**Checks**:
- [ ] Enums sind in Supabase verfügbar
- [ ] `SELECT * FROM pg_type WHERE typname LIKE '%app_role%'` gibt Ergebnis

**Weiter**: 004

📘 Reuse: feature/05-datenstruktur-pattern

---

## 004 Datenbank-Schema: Profiles

**Ziel**: `profiles` Tabelle mit Trigger erstellen.

**ToDo**:
- Erstelle `profiles` Tabelle:
  - `id` (UUID, PK, FK zu `auth.users.id`)
  - `email` (Text)
  - `full_name` (Text, optional)
  - `avatar_url` (Text, optional)
  - `preferred_language` (Text, default `'de'`)
  - `theme` (Text, default `'light'`)
  - `created_at`, `updated_at` (Timestamps)
- Erstelle Trigger `handle_new_user()` für automatische Profile-Erstellung
- RLS Policies: Owner-only Zugriff

**Output**:
- `supabase/migrations/YYYYMMDD_create_profiles.sql`

**Checks**:
- [ ] Registrierung eines neuen Users erstellt automatisch Profile-Eintrag
- [ ] RLS blockiert Cross-User Zugriff

**Weiter**: 005

📘 Reuse: feature/01-auth-profile-pattern

---

## 005 Datenbank-Schema: Organizations

**Ziel**: `organizations` und `organization_members` Tabellen erstellen.

**ToDo**:
- Erstelle `organizations`:
  - `id` (UUID, PK)
  - `name` (Text)
  - `description` (Text, optional)
  - `owner_id` (UUID, FK zu `auth.users.id`)
  - `created_at`, `updated_at`
- Erstelle `organization_members`:
  - `id` (UUID, PK)
  - `organization_id` (UUID, FK zu `organizations.id`, ON DELETE CASCADE)
  - `user_id` (UUID, FK zu `auth.users.id`, ON DELETE CASCADE)
  - `role` (Enum: `app_role`)
  - `created_at`, `updated_at`
  - UNIQUE Constraint: `(organization_id, user_id)`
- RLS Policies:
  - Owner kann Organisation verwalten
  - Member können Organisation sehen (basierend auf `organization_members`)

**Output**:
- `supabase/migrations/YYYYMMDD_create_organizations.sql`

**Checks**:
- [ ] User kann Organisation erstellen
- [ ] Owner kann Mitglieder hinzufügen
- [ ] Member sehen nur ihre Organisationen

**Weiter**: 006

📘 Reuse: feature/03-security-pattern

---

## 006 Datenbank-Schema: Projects

**Ziel**: `projects` Tabelle mit Organisations-Bezug erstellen.

**ToDo**:
- Erstelle `projects`:
  - `id` (UUID, PK)
  - `organization_id` (UUID, FK zu `organizations.id`, ON DELETE CASCADE)
  - `title` (Text)
  - `description` (Text, optional)
  - `archived` (Boolean, default `false`)
  - `created_at`, `updated_at`
- RLS Policies:
  - Member der zugehörigen Organisation können Projekt sehen
  - Owner/Manager der Organisation können Projekt bearbeiten/löschen
  - Read-Only Member nur Lesezugriff

**Output**:
- `supabase/migrations/YYYYMMDD_create_projects.sql`

**Checks**:
- [ ] Projekt wird erstellt und ist Organisations-Mitgliedern sichtbar
- [ ] Read-Only Member können nicht bearbeiten
- [ ] Manager können Projekte bearbeiten

**Weiter**: 007

📘 Reuse: feature/03-security-pattern

---

## 007 Datenbank-Schema: Companies

**Ziel**: `companies` Tabelle mit Projekt-Isolation erstellen.

**ToDo**:
- Erstelle `companies`:
  - `id` (UUID, PK)
  - `project_id` (UUID, FK zu `projects.id`, ON DELETE CASCADE)
  - `company` (Text)
  - `industry` (Text)
  - `ceo_name` (Text, optional)
  - `phone` (Text, optional)
  - `email` (Text, optional)
  - `website` (Text, optional)
  - `address` (Text, optional)
  - `district` (Text, optional)
  - `city` (Text, optional)
  - `state` (Text, optional)
  - `analysis` (JSONB, für Analyse Anna Daten)
  - `status` (Enum: `company_status`, default `'found'`)
  - `created_at`, `updated_at`
- Indizes: `project_id`, `email`, `phone`
- RLS Policies:
  - Zugriff nur über Projekt-Mitgliedschaft (via `organization_members`)

**Output**:
- `supabase/migrations/YYYYMMDD_create_companies.sql`

**Checks**:
- [ ] Companies sind projektspezifisch isoliert
- [ ] Nur Mitglieder der zugehörigen Organisation können Companies sehen
- [ ] Status-Updates funktionieren

**Weiter**: 008

📘 Reuse: feature/05-datenstruktur-pattern

---

## 008 Datenbank-Schema: Project Emails

**Ziel**: `project_emails` Tabelle für generierte E-Mails erstellen.

**ToDo**:
- Erstelle `project_emails`:
  - `id` (UUID, PK)
  - `project_id` (UUID, FK zu `projects.id`, ON DELETE CASCADE)
  - `company_id` (UUID, FK zu `companies.id`, ON DELETE CASCADE)
  - `recipient_email` (Text)
  - `subject` (Text)
  - `body` (Text, HTML-formatiert)
  - `status` (Enum: `email_status`, default `'draft'`)
  - `sent_at` (Timestamp, nullable)
  - `created_at`, `updated_at`
- Indizes: `project_id`, `company_id`, `status`
- RLS Policies:
  - Zugriff nur über Projekt-Mitgliedschaft

**Output**:
- `supabase/migrations/YYYYMMDD_create_project_emails.sql`

**Checks**:
- [ ] E-Mails sind projektspezifisch
- [ ] Status-Updates funktionieren
- [ ] `sent_at` wird korrekt gesetzt

**Weiter**: 009

📘 Reuse: feature/05-datenstruktur-pattern

---

## 009 Datenbank-Schema: Workflow States

**Ziel**: `n8n_workflow_states` Tabelle für Workflow-Status erstellen.

**ToDo**:
- Erstelle `n8n_workflow_states`:
  - `id` (UUID, PK)
  - `project_id` (UUID, FK zu `projects.id`, ON DELETE CASCADE)
  - `workflow_name` (Text: `'finder_felix'`, `'analyse_anna'`, `'pitch_paul'`, `'email_sender'`)
  - `status` (Enum: `workflow_status`)
  - `trigger_data` (JSONB, ursprüngliche Anfrage)
  - `result_summary` (JSONB, Zusammenfassung)
  - `started_at` (Timestamp)
  - `completed_at` (Timestamp, nullable)
  - `user_id` (UUID, FK zu `auth.users.id`)
  - `created_at`, `updated_at`
- Indizes: `project_id`, `workflow_name`, `status`
- RLS Policies: Projekt-Mitglieder können Status sehen

**Output**:
- `supabase/migrations/YYYYMMDD_create_workflow_states.sql`

**Checks**:
- [ ] Workflow-Status wird korrekt gespeichert
- [ ] Status-Updates funktionieren
- [ ] User kann Workflow-Historie sehen

**Weiter**: 010

📘 Reuse: feature/07-communication-realtime-pattern

---

## 010 Datenbank-Schema: Lookup-Tabellen (German Cities/Districts)

**Ziel**: Sicherstellen, dass `german_cities` und `german_districts` vorhanden sind.

**ToDo**:
- Prüfe, ob `german_cities` und `german_districts` existieren (laut Doku: bereits gefüllt)
- Falls nicht vorhanden: Erstelle Tabellen mit Beispiel-Daten:
  - `german_cities`: `id`, `state`, `city`, `created_at`
  - `german_districts`: `id`, `state`, `city`, `district`, `created_at`
- RLS: Public Read (für alle User)

**Output**:
- `supabase/migrations/YYYYMMDD_ensure_german_locations.sql` (falls nötig)

**Checks**:
- [ ] Tabellen existieren und sind gefüllt
- [ ] SELECT auf beiden Tabellen funktioniert

**Weiter**: 011

---

## 011 Datenbank-Schema: User Roles (SECURITY DEFINER)

**Ziel**: `user_roles` Tabelle mit SECURITY DEFINER Function erstellen.

**ToDo**:
- Erstelle `user_roles`:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK zu `auth.users.id`, ON DELETE CASCADE)
  - `role` (Enum: `app_role`)
  - `created_at`
  - UNIQUE: `(user_id, role)`
- Erstelle Function `has_role(_user_id uuid, _role app_role) RETURNS boolean` mit `SECURITY DEFINER`
- RLS Policies:
  - User kann eigene Rollen sehen
  - Owner können Rollen verwalten (via Function)

**Output**:
- `supabase/migrations/YYYYMMDD_create_user_roles.sql`

**Checks**:
- [ ] Function `has_role()` funktioniert
- [ ] Rekursions-Fehler tritt nicht auf
- [ ] RLS verwendet Function korrekt

**Weiter**: 012

📘 Reuse: feature/03-security-pattern

---

## 012 Realtime für Workflow-States aktivieren

**Ziel**: Supabase Realtime für `n8n_workflow_states` aktivieren.

**ToDo**:
- Aktiviere Realtime für `n8n_workflow_states`:
  ```sql
  ALTER TABLE n8n_workflow_states REPLICA IDENTITY FULL;
  ALTER PUBLICATION supabase_realtime ADD TABLE n8n_workflow_states;
  ```
- Dokumentiere Realtime-Setup in `docs/REALTIME_CONFIG.md`

**Output**:
- `supabase/migrations/YYYYMMDD_enable_realtime.sql`
- `docs/REALTIME_CONFIG.md`

**Checks**:
- [ ] Realtime-Subscription auf `n8n_workflow_states` funktioniert
- [ ] Status-Updates werden in Echtzeit empfangen

**Weiter**: 013

📘 Reuse: feature/07-communication-realtime-pattern

---

## 013 AuthContext & AuthProvider

**Ziel**: Authentifizierungs-Context mit User, Session und Profile implementieren.

**ToDo**:
- Erstelle `src/contexts/AuthContext.tsx`:
  - State: `user`, `session`, `profile`, `loading`
  - Methoden: `signUp()`, `signIn()`, `signOut()`, `refreshProfile()`
  - Auth State Listener mit `supabase.auth.onAuthStateChange()`
  - Automatisches Profile-Loading bei Session-Change
- Integriere `AuthProvider` in `src/App.tsx`

**Output**:
- `src/contexts/AuthContext.tsx`
- Update: `src/App.tsx`

**Checks**:
- [ ] Login funktioniert und lädt Profile
- [ ] Logout löscht Session und Profile
- [ ] Registrierung erstellt User + Profile automatisch

**Weiter**: 014

📘 Reuse: feature/01-auth-profile-pattern

---

## 014 ProtectedRoute Component

**Ziel**: Route-Guard für authentifizierungspflichtige Seiten.

**ToDo**:
- Erstelle `src/components/auth/ProtectedRoute.tsx`
- Prüft `user` aus `useAuth()`
- Redirect zu `/auth` wenn nicht eingeloggt
- Loading-State während Auth-Check

**Output**:
- `src/components/auth/ProtectedRoute.tsx`

**Checks**:
- [ ] Nicht-authentifizierte User werden zu `/auth` redirected
- [ ] Authentifizierte User sehen geschützte Inhalte

**Weiter**: 015

📘 Reuse: feature/01-auth-profile-pattern

---

## 015 Auth-Pages: Login & Registrierung

**Ziel**: Login- und Registrierungs-Formular erstellen.

**ToDo**:
- Erstelle `src/pages/Auth.tsx`:
  - Tab-Switcher: Login vs. Registrierung
  - Login-Form: Email, Passwort
  - Registrierungs-Form: Email, Passwort, Full Name
  - Error-Handling & Toast-Notifications
  - Loading States
- Verwende `react-hook-form` + `zod` für Validation
- Verwende shadcn/ui Components: `Card`, `Tabs`, `Input`, `Button`

**Output**:
- `src/pages/Auth.tsx`
- `src/lib/validations/auth.ts` (Zod Schemas)

**Checks**:
- [ ] Login mit korrekten Credentials funktioniert
- [ ] Registrierung erstellt User + Profile
- [ ] Fehler werden korrekt angezeigt
- [ ] Nach Login: Redirect zu `/dashboard`

**Weiter**: 016

📘 Reuse: feature/06-ui-ux-pattern

---

## 016 Profile-Settings Page

**Ziel**: User kann Profil bearbeiten (Name, Avatar, Theme, Sprache).

**ToDo**:
- Erstelle `src/pages/ProfileSettings.tsx`:
  - Form für `full_name`, `avatar_url`, `theme`, `preferred_language`
  - Avatar-Upload via Supabase Storage (optional)
  - Theme-Switcher (Light/Dark)
  - Sprache-Switcher (DE/EN)
- Update-Funktion mit Toast-Feedback
- Verwende `react-hook-form` + `zod`

**Output**:
- `src/pages/ProfileSettings.tsx`
- Update: `src/contexts/AuthContext.tsx` (refreshProfile-Call nach Update)

**Checks**:
- [ ] Profil-Updates werden gespeichert
- [ ] Theme-Wechsel funktioniert sofort
- [ ] Avatar-Upload funktioniert (falls implementiert)

**Weiter**: 017

📘 Reuse: feature/01-auth-profile-pattern

---

## 017 Organization Management: Create & List

**Ziel**: User kann Organisationen erstellen und auflisten.

**ToDo**:
- Erstelle `src/pages/Organizations.tsx`:
  - Liste aller Organisationen des Users
  - Button "Organisation erstellen"
  - Dialog mit Form: Name, Beschreibung
- Erstelle `src/hooks/useOrganizations.ts`:
  - `useQuery` für Organisation-Liste
  - `useMutation` für Create/Update/Delete
- RLS-Check: Nur Organisationen, bei denen User Member ist

**Output**:
- `src/pages/Organizations.tsx`
- `src/hooks/useOrganizations.ts`
- `src/components/organizations/OrganizationCard.tsx`
- `src/components/organizations/CreateOrganizationDialog.tsx`

**Checks**:
- [ ] User sieht nur seine Organisationen
- [ ] Neue Organisation wird korrekt erstellt
- [ ] Owner wird automatisch als Member mit `role='owner'` hinzugefügt

**Weiter**: 018

📘 Reuse: feature/05-datenstruktur-pattern

---

## 018 Organization Members: Invite & Manage

**Ziel**: Owner/Manager können Mitglieder einladen und Rollen verwalten.

**ToDo**:
- Erstelle `src/pages/OrganizationSettings.tsx`:
  - Tab "Members"
  - Liste aller Members mit Rollen
  - Button "Mitglied einladen"
  - Dialog: E-Mail, Rolle (Owner/Manager/Read-Only)
  - Rolle-Änderung für bestehende Members (nur für Owner)
  - Member entfernen (nur für Owner)
- Erstelle `src/hooks/useOrganizationMembers.ts`

**Output**:
- `src/pages/OrganizationSettings.tsx`
- `src/hooks/useOrganizationMembers.ts`
- `src/components/organizations/InviteMemberDialog.tsx`
- `src/components/organizations/MemberList.tsx`

**Checks**:
- [ ] Owner kann Members hinzufügen
- [ ] Rollen-Änderung funktioniert
- [ ] Read-Only Member kann nicht bearbeiten
- [ ] Member-Entfernung funktioniert

**Weiter**: 019

📘 Reuse: feature/08-advanced-sharing-pattern

---

## 019 Project Management: Create & List

**Ziel**: User kann Projekte in Organisationen erstellen und auflisten.

**ToDo**:
- Erstelle `src/pages/Projects.tsx`:
  - Dropdown: Organisation auswählen
  - Liste aller Projekte der gewählten Organisation
  - Button "Projekt erstellen"
  - Dialog: Titel, Beschreibung
- Erstelle `src/hooks/useProjects.ts`:
  - `useQuery` für Projekt-Liste (gefiltert nach `organization_id`)
  - `useMutation` für Create/Update/Archive

**Output**:
- `src/pages/Projects.tsx`
- `src/hooks/useProjects.ts`
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/CreateProjectDialog.tsx`

**Checks**:
- [ ] Projekte werden korrekt erstellt
- [ ] Nur Projekte der gewählten Organisation werden angezeigt
- [ ] Manager/Owner können Projekte bearbeiten
- [ ] Read-Only Member können nicht erstellen/bearbeiten

**Weiter**: 020

📘 Reuse: feature/05-datenstruktur-pattern

---

## 020 Project Dashboard: Overview

**Ziel**: Dashboard für einzelnes Projekt mit KPIs und Aktionen.

**ToDo**:
- Erstelle `src/pages/ProjectDashboard.tsx`:
  - Header: Projekt-Titel, Organisation, Beschreibung
  - KPI-Cards:
    - Anzahl Companies (Status: found/analyzed/contacted)
    - Anzahl E-Mails (Status: draft/sent)
    - Workflow-Stati (Felix/Anna/Paul)
  - Action-Buttons:
    - "Firmen suchen (Felix)"
    - "Firmen analysieren (Anna)"
    - "E-Mails generieren (Paul)"
    - "E-Mails versenden"
- Verwende `shadcn/ui`: `Card`, `Badge`, `Button`

**Output**:
- `src/pages/ProjectDashboard.tsx`
- `src/components/projects/ProjectKPIs.tsx`
- `src/components/projects/ProjectActions.tsx`

**Checks**:
- [ ] KPIs werden korrekt berechnet
- [ ] Action-Buttons sind sichtbar
- [ ] Navigation zu Companies/Emails funktioniert

**Weiter**: 021

📘 Reuse: feature/06-ui-ux-pattern

---

## 021 Project Settings: Archive & Delete

**Ziel**: Owner/Manager können Projekte archivieren und löschen.

**ToDo**:
- Erstelle `src/pages/ProjectSettings.tsx`:
  - Tab "General": Titel, Beschreibung bearbeiten
  - Tab "Danger Zone":
    - Button "Projekt archivieren" (setzt `archived=true`)
    - Button "Projekt löschen" (mit Bestätigungsdialog)
- Archivierte Projekte in Liste ausblenden (Filter)
- RLS-Check: Nur Owner/Manager dürfen löschen

**Output**:
- `src/pages/ProjectSettings.tsx`
- `src/components/projects/DangerZone.tsx`

**Checks**:
- [ ] Archivierung funktioniert
- [ ] Löschung mit Bestätigung funktioniert
- [ ] Read-Only Member sehen keine Danger Zone

**Weiter**: 022

📘 Reuse: feature/05-datenstruktur-pattern

---

## 022 Routing & Navigation Setup

**Ziel**: Vollständiges Routing mit Navigation einrichten.

**ToDo**:
- Update `src/App.tsx` mit allen Routes:
  - `/` → Landing/Dashboard
  - `/auth` → Login/Registrierung
  - `/organizations` → Organisation-Liste
  - `/organizations/:id` → Organisation-Details
  - `/projects` → Projekt-Liste
  - `/projects/:id` → Projekt-Dashboard
  - `/projects/:id/companies` → Firmen-Liste
  - `/projects/:id/emails` → E-Mail-Liste
  - `/profile` → Profile-Settings
- Erstelle `src/components/layout/Navigation.tsx`:
  - Logo/Brand
  - Links zu Hauptseiten
  - User-Dropdown (Profile, Logout)
- Verwende `react-router-dom`

**Output**:
- Update: `src/App.tsx`
- `src/components/layout/Navigation.tsx`
- `src/components/layout/Layout.tsx`

**Checks**:
- [ ] Alle Routes sind erreichbar
- [ ] Navigation funktioniert
- [ ] ProtectedRoutes blockieren unauth User

**Weiter**: 023

📘 Reuse: feature/06-ui-ux-pattern

---

## 023 Webhook-Integration: Finder Felix Trigger

**Ziel**: User kann "Finder Felix" Workflow per Freitext-Input starten.

**ToDo**:
- Erstelle `src/components/workflows/FinderFelixDialog.tsx`:
  - Textarea: Freitext-Anfrage (z.B. "Solartechnik in Berlin")
  - Dropdown: Bundesland/Stadt/Bezirk (optional, vorbefüllt)
  - Button "Suche starten"
  - POST zu n8n Webhook: `/webhook/finder-felix`
    - Body: `{ user_input, project_id, user_id }`
  - Response: `workflow_id` → speichere in `n8n_workflow_states`
- Erstelle `src/hooks/useWorkflowTrigger.ts` für Webhook-Calls
- Error-Handling & Toast-Notifications

**Output**:
- `src/components/workflows/FinderFelixDialog.tsx`
- `src/hooks/useWorkflowTrigger.ts`

**Checks**:
- [ ] Webhook wird erfolgreich getriggert
- [ ] Workflow-Status wird in DB gespeichert
- [ ] Fehler werden korrekt angezeigt

**Weiter**: 024

📘 Reuse: feature/04-ki-integration-pattern

---

## 024 Webhook-Integration: Analyse Anna Trigger

**Ziel**: User kann "Analyse Anna" Workflow starten.

**ToDo**:
- Erstelle `src/components/workflows/AnalyseAnnaDialog.tsx`:
  - Textarea: Freitext-Anfrage (z.B. "Finde CEO und Wärmepumpen-Angebote")
  - Multi-Select: Firmen auswählen (aus `companies`)
  - Button "Analyse starten"
  - POST zu n8n Webhook: `/webhook/analyse-anna`
    - Body: `{ user_input, project_id, company_ids[], user_id }`
  - Response-Handling wie bei Felix
- Verwende `src/hooks/useWorkflowTrigger.ts`

**Output**:
- `src/components/workflows/AnalyseAnnaDialog.tsx`
- Update: `src/hooks/useWorkflowTrigger.ts` (generisch für alle Workflows)

**Checks**:
- [ ] Analyse wird gestartet
- [ ] Workflow-Status wird gespeichert
- [ ] `analysis` Feld in `companies` wird gefüllt (nach Workflow)

**Weiter**: 025

📘 Reuse: feature/04-ki-integration-pattern

---

## 025 Webhook-Integration: Pitch Paul Trigger

**Ziel**: User kann "Pitch Paul" Workflow zur E-Mail-Generierung starten.

**ToDo**:
- Erstelle `src/components/workflows/PitchPaulDialog.tsx`:
  - Textarea: Freitext-Anfrage (z.B. "Pitch Wärmepumpen-Service")
  - Multi-Select: Firmen auswählen (optional, sonst alle mit Status=analyzed)
  - Button "E-Mails generieren"
  - POST zu n8n Webhook: `/webhook/pitch-paul-generate`
    - Body: `{ user_input, project_id, company_ids[], user_id }`
  - Response: `workflow_id` → E-Mails werden in `project_emails` gespeichert
- Verwende `src/hooks/useWorkflowTrigger.ts`

**Output**:
- `src/components/workflows/PitchPaulDialog.tsx`

**Checks**:
- [ ] E-Mail-Generierung wird gestartet
- [ ] Generierte E-Mails erscheinen in `project_emails` (Status=draft)

**Weiter**: 026

📘 Reuse: feature/04-ki-integration-pattern

---

## 026 Webhook-Integration: E-Mail Versand (Single)

**Ziel**: User kann einzelne E-Mail versenden.

**ToDo**:
- Erstelle `src/components/emails/SendEmailButton.tsx`:
  - Button "Versenden" in E-Mail-Detail-View
  - POST zu n8n Webhook: `/webhook/email-sender`
    - Body: `{ project_email_id, user_id }`
  - Response: Status-Update (sent/failed)
  - Update `project_emails.status` und `sent_at`
- Error-Handling & Toast

**Output**:
- `src/components/emails/SendEmailButton.tsx`

**Checks**:
- [ ] E-Mail wird versendet (Status=sent)
- [ ] `sent_at` Timestamp wird gesetzt
- [ ] Fehler werden abgefangen (Status=failed)

**Weiter**: 027

📘 Reuse: feature/04-ki-integration-pattern

---

## 027 Webhook-Integration: E-Mail Versand (Batch)

**Ziel**: User kann mehrere E-Mails in Batch versenden.

**ToDo**:
- Erstelle `src/components/emails/SendEmailsBatchButton.tsx`:
  - Multi-Select: E-Mails auswählen (Status=ready_to_send oder draft)
  - Button "Ausgewählte versenden"
  - POST zu n8n Webhook: `/webhook/email-sender-batch`
    - Body: `{ project_id, email_ids[], user_id }`
  - Response: Status-Updates für alle E-Mails
- Progress-Anzeige während Versand
- Toast: "X von Y E-Mails versendet"

**Output**:
- `src/components/emails/SendEmailsBatchButton.tsx`

**Checks**:
- [ ] Batch-Versand funktioniert
- [ ] Status-Updates für alle E-Mails
- [ ] Progress-Anzeige funktioniert

**Weiter**: 028

📘 Reuse: feature/04-ki-integration-pattern

---

## 028 Workflow-Status: Realtime Updates

**Ziel**: User sieht Workflow-Status in Echtzeit.

**ToDo**:
- Erstelle `src/hooks/useWorkflowStatus.ts`:
  - Supabase Realtime Subscription auf `n8n_workflow_states`
  - Filter: `project_id = current_project.id`
  - Event-Listener: INSERT, UPDATE
  - State-Update in React
- Erstelle `src/components/workflows/WorkflowStatusBadge.tsx`:
  - Zeigt Status-Badge (pending/running/completed/failed)
  - Farben: pending=yellow, running=blue, completed=green, failed=red
- Integriere in Projekt-Dashboard & Workflow-Dialoge

**Output**:
- `src/hooks/useWorkflowStatus.ts`
- `src/components/workflows/WorkflowStatusBadge.tsx`
- Update: `src/pages/ProjectDashboard.tsx`

**Checks**:
- [ ] Status-Updates werden in Echtzeit angezeigt
- [ ] Badge-Farben sind korrekt
- [ ] Subscription wird korrekt aufgeräumt (cleanup)

**Weiter**: 029

📘 Reuse: feature/07-communication-realtime-pattern

---

## 029 Companies List: Anzeige & Filter

**Ziel**: User kann alle Firmen eines Projekts sehen und filtern.

**ToDo**:
- Erstelle `src/pages/ProjectCompanies.tsx`:
  - Tabelle mit Spalten: Firma, Branche, Stadt, Status, Aktionen
  - Filter:
    - Status (found/analyzed/contacted)
    - Branche
    - Stadt/Bundesland
  - Sortierung: Name, Status, Datum
  - Pagination (Infinite Scroll oder Pagination-Component)
- Erstelle `src/hooks/useCompanies.ts`:
  - `useQuery` mit Filtern
  - `useMutation` für Update/Delete
- Verwende shadcn/ui: `Table`, `Select`, `Input`

**Output**:
- `src/pages/ProjectCompanies.tsx`
- `src/hooks/useCompanies.ts`
- `src/components/companies/CompaniesTable.tsx`
- `src/components/companies/CompanyFilters.tsx`

**Checks**:
- [ ] Companies werden korrekt angezeigt
- [ ] Filter funktionieren
- [ ] Sortierung funktioniert
- [ ] Pagination funktioniert

**Weiter**: 030

📘 Reuse: feature/05-datenstruktur-pattern

---

## 030 Company Detail View

**Ziel**: Detailansicht für einzelne Firma mit allen Daten.

**ToDo**:
- Erstelle `src/pages/CompanyDetail.tsx`:
  - Alle Felder: Name, Branche, CEO, Kontaktdaten, Website, Adresse
  - Analysis-Daten (JSONB) formatiert anzeigen
  - Status-Änderung (Dropdown)
  - Button "Firma analysieren (Anna)" → triggert Analyse-Workflow
  - Button "E-Mail generieren (Paul)" → triggert E-Mail-Workflow für diese Firma
- Verwende `react-hook-form` für Edit-Mode (optional)

**Output**:
- `src/pages/CompanyDetail.tsx`
- `src/components/companies/CompanyInfo.tsx`
- `src/components/companies/AnalysisDisplay.tsx`

**Checks**:
- [ ] Alle Daten werden korrekt angezeigt
- [ ] Analysis-JSONB wird formatiert dargestellt
- [ ] Status-Änderung funktioniert
- [ ] Workflow-Trigger funktionieren

**Weiter**: 031

📘 Reuse: feature/06-ui-ux-pattern

---

## 031 Company Import/Export (optional)

**Ziel**: User kann Firmen-Daten importieren und exportieren.

**ToDo**:
- Erstelle `src/components/companies/ImportCompaniesButton.tsx`:
  - CSV-Upload
  - Parsing mit `papaparse` oder ähnlich
  - Mapping: CSV-Spalten → `companies` Felder
  - Batch-Insert in Supabase
- Erstelle `src/components/companies/ExportCompaniesButton.tsx`:
  - CSV-Export aller Firmen des Projekts
  - Download als File
- Error-Handling für fehlerhafte Daten

**Output**:
- `src/components/companies/ImportCompaniesButton.tsx`
- `src/components/companies/ExportCompaniesButton.tsx`

**Checks**:
- [ ] CSV-Import funktioniert
- [ ] CSV-Export funktioniert
- [ ] Fehlerhafte Daten werden abgefangen

**Weiter**: 032

📘 Reuse: feature/05-datenstruktur-pattern

---

## 032 Project Emails List: Anzeige & Filter

**Ziel**: User kann alle E-Mails eines Projekts sehen und filtern.

**ToDo**:
- Erstelle `src/pages/ProjectEmails.tsx`:
  - Tabelle: Empfänger, Betreff, Status, Erstelldatum, Aktionen
  - Filter:
    - Status (draft/ready_to_send/sent/failed)
    - Firma (Company-Name)
  - Sortierung: Datum, Status
  - Pagination
- Erstelle `src/hooks/useEmails.ts`:
  - `useQuery` mit Filtern
  - `useMutation` für Update/Delete

**Output**:
- `src/pages/ProjectEmails.tsx`
- `src/hooks/useEmails.ts`
- `src/components/emails/EmailsTable.tsx`
- `src/components/emails/EmailFilters.tsx`

**Checks**:
- [ ] E-Mails werden korrekt angezeigt
- [ ] Filter funktionieren
- [ ] Sortierung funktioniert

**Weiter**: 033

📘 Reuse: feature/05-datenstruktur-pattern

---

## 033 Email Detail View & Editor

**Ziel**: E-Mail-Detailansicht mit Vorschau und Edit-Möglichkeit.

**ToDo**:
- Erstelle `src/pages/EmailDetail.tsx`:
  - Felder: Empfänger, Betreff, Body (HTML)
  - HTML-Vorschau (iframe oder dangerouslySetInnerHTML mit Sanitize)
  - Edit-Mode: Textarea für Subject, Rich-Text-Editor für Body (z.B. `react-quill`)
  - Status-Änderung (Dropdown)
  - Buttons:
    - "Versenden" (Status=ready_to_send → Trigger Email-Sender)
    - "Als Draft speichern"
- Verwende `react-hook-form` + `zod`

**Output**:
- `src/pages/EmailDetail.tsx`
- `src/components/emails/EmailPreview.tsx`
- `src/components/emails/EmailEditor.tsx`

**Checks**:
- [ ] E-Mail wird korrekt angezeigt (HTML-Vorschau)
- [ ] Edit-Mode funktioniert
- [ ] Versand-Button funktioniert
- [ ] Draft-Speicherung funktioniert

**Weiter**: 034

📘 Reuse: feature/06-ui-ux-pattern

---

## 034 Email Templates (optional)

**Ziel**: User kann E-Mail-Templates erstellen und wiederverwenden.

**ToDo**:
- Erstelle `email_templates` Tabelle:
  - `id`, `organization_id`, `title`, `subject_template`, `body_template`, `created_at`
- RLS: Organisation-Mitglieder können Templates sehen/bearbeiten
- Erstelle `src/pages/EmailTemplates.tsx`:
  - Liste aller Templates
  - Button "Template erstellen"
  - Edit-Dialog für Template
- Integration in Pitch Paul: Template-Auswahl vor Generierung

**Output**:
- `supabase/migrations/YYYYMMDD_create_email_templates.sql`
- `src/pages/EmailTemplates.tsx`
- `src/hooks/useEmailTemplates.ts`
- `src/components/emails/TemplateSelector.tsx`

**Checks**:
- [ ] Templates werden korrekt erstellt
- [ ] Template-Auswahl in Pitch Paul funktioniert
- [ ] Variablen (z.B. {{company_name}}) werden ersetzt

**Weiter**: 035

📘 Reuse: feature/05-datenstruktur-pattern

---

## 035 Dashboard: Landing Page

**Ziel**: Haupt-Dashboard mit Übersicht aller Organisationen und Projekte.

**ToDo**:
- Erstelle `src/pages/Dashboard.tsx`:
  - Sektion "Meine Organisationen": Cards mit Quick-Links
  - Sektion "Aktuelle Projekte": Cards mit KPIs
  - Sektion "Workflow-Status": Liste laufender Workflows
  - Button "Neue Organisation"
  - Button "Neues Projekt"
- Verwende shadcn/ui: `Card`, `Badge`, `Button`

**Output**:
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/OrganizationCards.tsx`
- `src/components/dashboard/RecentProjects.tsx`
- `src/components/dashboard/ActiveWorkflows.tsx`

**Checks**:
- [ ] Dashboard zeigt alle relevanten Daten
- [ ] Quick-Links funktionieren
- [ ] KPIs sind korrekt

**Weiter**: 036

📘 Reuse: feature/06-ui-ux-pattern

---

## 036 Notifications & Toast System

**Ziel**: Globales Toast-System für Benachrichtigungen.

**ToDo**:
- Integriere `sonner` (bereits in Dependencies)
- Erstelle `src/lib/notifications.ts`:
  - Helper-Funktionen: `notifySuccess()`, `notifyError()`, `notifyInfo()`
  - Standard-Messages für häufige Aktionen (z.B. "Projekt erstellt", "E-Mail versendet")
- Ersetze alle bestehenden Toast-Calls durch zentrale Helper
- Optional: Persistente Notifications in DB (wie in Feature Library 07)

**Output**:
- `src/lib/notifications.ts`
- Update: Alle Komponenten mit Toast-Calls

**Checks**:
- [ ] Toasts erscheinen korrekt
- [ ] Success/Error/Info Varianten funktionieren
- [ ] Auto-Dismiss funktioniert

**Weiter**: 037

📘 Reuse: feature/06-ui-ux-pattern

---

## 037 Design System: Theme & HSL-Tokens

**Ziel**: Design System mit HSL-Tokens einrichten (Light/Dark Mode).

**ToDo**:
- Update `src/index.css`:
  - Definiere HSL-Variablen für `:root` (Light) und `.dark` (Dark)
  - Farben: background, foreground, primary, secondary, accent, muted, destructive, border
  - Radius-Variablen
- Update `tailwind.config.ts`:
  - Mapping: `hsl(var(--primary))` → `colors.primary`
- Prüfe alle Komponenten: Keine direkten Farben (z.B. `bg-blue-500`), nur semantische Tokens
- Theme-Switcher (bereits in Task 016 vorbereitet)

**Output**:
- Update: `src/index.css`
- Update: `tailwind.config.ts`
- Dokumentation: `docs/DESIGN_SYSTEM.md`

**Checks**:
- [ ] Light/Dark Mode funktioniert
- [ ] Alle Farben sind HSL-basiert
- [ ] Theme-Wechsel ist smooth

**Weiter**: 038

📘 Reuse: feature/06-ui-ux-pattern

---

## 038 Responsive Design: Mobile-First

**Ziel**: Alle Pages sind vollständig responsive.

**ToDo**:
- Prüfe alle Pages auf Mobile-Kompatibilität:
  - Navigation: Mobile Drawer (Sheet)
  - Tabellen: Horizontal Scroll oder Card-View
  - Dialoge: Sheet statt Dialog auf Mobile
  - Formulare: Touch-optimiert
- Erstelle `src/hooks/use-mobile.tsx` (falls nicht vorhanden)
- Adaptive Components: `AdaptiveModal`, `ResponsiveNav`
- Test auf verschiedenen Breakpoints (sm, md, lg, xl)

**Output**:
- `src/hooks/use-mobile.tsx`
- Update: Alle Komponenten mit Responsive-Checks
- Dokumentation: `docs/RESPONSIVE_GUIDELINES.md`

**Checks**:
- [ ] Alle Pages funktionieren auf Mobile
- [ ] Navigation ist touch-optimiert
- [ ] Tabellen sind scrollbar oder als Cards dargestellt

**Weiter**: 039

📘 Reuse: feature/06-ui-ux-pattern

---

## 039 Internationalisierung (i18n) Setup (optional)

**Ziel**: Multi-Language Support (DE/EN) einrichten.

**ToDo**:
- Installiere `react-i18next` (falls nicht vorhanden)
- Erstelle `src/i18n/`:
  - `de.json` (Deutsch)
  - `en.json` (Englisch)
- Konfiguriere i18next in `src/i18n/config.ts`
- Integriere in `src/App.tsx`
- Language-Switcher in Navigation
- Übersetze kritische UI-Texte (Buttons, Labels, Error-Messages)

**Output**:
- `src/i18n/de.json`
- `src/i18n/en.json`
- `src/i18n/config.ts`
- `src/components/layout/LanguageSwitcher.tsx`

**Checks**:
- [ ] Sprachwechsel funktioniert
- [ ] Übersetzungen werden korrekt angezeigt
- [ ] Sprache wird in `profiles.preferred_language` gespeichert

**Weiter**: 040

📘 Reuse: feature/06-ui-ux-pattern

---

## 040 Loading States & Skeletons

**Ziel**: Alle Daten-Lade-Vorgänge haben Loading-States.

**ToDo**:
- Erstelle Skeleton-Components:
  - `src/components/ui/skeleton-card.tsx`
  - `src/components/ui/skeleton-table.tsx`
  - `src/components/ui/skeleton-list.tsx`
- Integriere in alle `useQuery`-Hooks:
  - `isLoading` → zeige Skeleton
  - `isError` → zeige Error-State
  - `data` → zeige Inhalte
- Verwende `Skeleton` Component von shadcn/ui

**Output**:
- `src/components/ui/skeleton-card.tsx`
- `src/components/ui/skeleton-table.tsx`
- Update: Alle Pages mit Loading-States

**Checks**:
- [ ] Loading-States sind überall vorhanden
- [ ] Skeletons sehen optisch stimmig aus
- [ ] Keine "Flash of Empty Content"

**Weiter**: 041

📘 Reuse: feature/06-ui-ux-pattern

---

## 041 Error Handling & Error Boundaries

**Ziel**: Globale Error-Handling-Strategie implementieren.

**ToDo**:
- Erstelle `src/components/ErrorBoundary.tsx`:
  - React Error Boundary für unerwartete Fehler
  - Fallback-UI mit Fehler-Anzeige
  - Optional: Error-Reporting (z.B. Sentry)
- Erstelle `src/components/ErrorFallback.tsx`:
  - Generische Fehler-Anzeige
  - Button "Erneut versuchen"
- Integriere in `src/App.tsx` (Wrap gesamte App)

**Output**:
- `src/components/ErrorBoundary.tsx`
- `src/components/ErrorFallback.tsx`
- Update: `src/App.tsx`

**Checks**:
- [ ] Error Boundary fängt Fehler ab
- [ ] Fallback-UI wird angezeigt
- [ ] "Erneut versuchen" funktioniert

**Weiter**: 042

📘 Reuse: feature/06-ui-ux-pattern

---

## 042 Performance: Query Optimization

**Ziel**: Datenbank-Queries optimieren mit Indizes und Filters.

**ToDo**:
- Erstelle Indizes für häufig abgefragte Felder:
  - `companies`: `project_id`, `status`, `email`, `phone`
  - `project_emails`: `project_id`, `company_id`, `status`
  - `n8n_workflow_states`: `project_id`, `workflow_name`, `status`
  - `organization_members`: `organization_id`, `user_id`
- Prüfe Queries auf `.select('*')` → nur benötigte Felder laden
- Implementiere Pagination (Limit/Offset) für große Listen
- Optional: Implementiere Caching mit React Query

**Output**:
- `supabase/migrations/YYYYMMDD_add_indexes.sql`
- Update: Alle Hooks mit optimierten Queries

**Checks**:
- [ ] Indizes sind erstellt
- [ ] Queries sind auf benötigte Felder beschränkt
- [ ] Pagination funktioniert
- [ ] Ladezeiten sind akzeptabel (<2s)

**Weiter**: 043

📘 Reuse: feature/05-datenstruktur-pattern

---

## 043 Accessibility (A11y) Check

**Ziel**: Sicherstellen, dass die App barrierefrei ist.

**ToDo**:
- Prüfe alle Komponenten:
  - `aria-label` auf Buttons/Icons
  - Keyboard-Navigation funktioniert
  - Focus-States sind sichtbar
  - Kontrast-Ratios sind WCAG AA konform (4.5:1 für Text)
  - `alt`-Attribute auf Bildern
- Teste mit Screenreader (z.B. NVDA, VoiceOver)
- Verwende `eslint-plugin-jsx-a11y` (falls nicht aktiv)

**Output**:
- Update: Alle Komponenten mit A11y-Fixes
- Dokumentation: `docs/ACCESSIBILITY.md`

**Checks**:
- [ ] Keyboard-Navigation funktioniert überall
- [ ] Kontrast-Ratios sind korrekt
- [ ] Screenreader kann Inhalte vorlesen
- [ ] Keine A11y-Warnings in Console

**Weiter**: 044

📘 Reuse: feature/06-ui-ux-pattern

---

## 044 Landing Page (Public)

**Ziel**: Öffentliche Landing Page mit Projekt-Beschreibung.

**ToDo**:
- Erstelle `src/pages/Landing.tsx`:
  - Hero-Sektion: Headline, Subtitle, CTA-Button "Kostenlos starten"
  - Features-Sektion: 3 KI-Workflows erklärt (Felix, Anna, Paul)
  - Pricing-Sektion (optional, falls geplant)
  - Footer: Impressum, Datenschutz, Kontakt
- Verwende `react-router-dom`: Redirect zu `/auth` wenn User nicht eingeloggt

**Output**:
- `src/pages/Landing.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/Features.tsx`
- `src/components/layout/Footer.tsx`

**Checks**:
- [ ] Landing Page ist öffentlich zugänglich
- [ ] CTA-Button führt zu `/auth`
- [ ] Features sind verständlich erklärt

**Weiter**: 045

📘 Reuse: feature/06-ui-ux-pattern

---

## 045 SEO & Meta Tags

**Ziel**: SEO-optimierte Meta-Tags einrichten.

**ToDo**:
- Update `index.html`:
  - `<title>`: Cold Calling App | KI-gestützte Kaltakquise
  - `<meta name="description">`: Max 160 Zeichen
  - `<meta property="og:title">`, `og:description`, `og:image`
  - `<meta name="viewport">`
  - `<link rel="canonical">`
- Optional: `react-helmet` für dynamische Meta-Tags pro Seite
- robots.txt: `public/robots.txt` (allow all)

**Output**:
- Update: `index.html`
- `public/robots.txt` (bereits vorhanden, prüfen)
- Optional: `src/hooks/useSeo.ts` (react-helmet)

**Checks**:
- [ ] Meta-Tags sind korrekt gesetzt
- [ ] robots.txt erlaubt Crawling
- [ ] Open Graph Preview funktioniert

**Weiter**: 046

---

## 046 Documentation: User Guide

**Ziel**: User-Dokumentation erstellen.

**ToDo**:
- Erstelle `docs/USER_GUIDE.md`:
  - Schnellstart: Registrierung, erste Organisation, erstes Projekt
  - Workflows:
    - Felix: Wie Firmen suchen?
    - Anna: Wie Firmen analysieren?
    - Paul: Wie E-Mails generieren?
  - E-Mail-Versand: Single & Batch
  - FAQ: Häufige Fragen
- Optional: In-App Hilfe-Dialoge (z.B. "?" Icons)

**Output**:
- `docs/USER_GUIDE.md`
- Optional: `src/components/help/HelpDialog.tsx`

**Checks**:
- [ ] User Guide ist verständlich geschrieben
- [ ] Alle Hauptfeatures sind dokumentiert
- [ ] Screenshots/GIFs sind vorhanden (optional)

**Weiter**: 047

---

## 047 Documentation: Technical Docs

**Ziel**: Technische Dokumentation für Entwickler.

**ToDo**:
- Update `docs/SOFTWARE_DOKU.md`: Ergänze Implementation-Details
- Erstelle `docs/API_REFERENCE.md`:
  - Supabase Tabellen-Schemas
  - RLS Policies
  - Edge Functions (falls vorhanden)
  - n8n Webhook-Endpunkte
- Erstelle `docs/DEPLOYMENT.md`:
  - Lovable Cloud Deployment-Prozess
  - Environment Variables
  - n8n-Setup-Anleitung

**Output**:
- Update: `docs/SOFTWARE_DOKU.md`
- `docs/API_REFERENCE.md`
- `docs/DEPLOYMENT.md`

**Checks**:
- [ ] Alle Tabellen sind dokumentiert
- [ ] Webhook-Endpunkte sind beschrieben
- [ ] Deployment-Prozess ist klar

**Weiter**: 048

---

## 048 Progress Log Setup

**Ziel**: PROGRESS_LOG.md erstellen und initialisieren.

**ToDo**:
- Erstelle `docs/PROGRESS_LOG.md` mit Struktur:
  - **Status Board**: Übersicht Task-Status (Not Started/In Progress/Done)
  - **Current Sprint**: Aktuelle Tasks (001-010)
  - **Change Log**: Datum, Task-ID, Änderungen
  - **Decisions**: Wichtige Entscheidungen dokumentieren
  - **Blockers**: Offene Probleme
- Initialisiere Status Board mit allen Tasks (001-052)

**Output**:
- `docs/PROGRESS_LOG.md`

**Checks**:
- [ ] PROGRESS_LOG.md ist erstellt
- [ ] Status Board ist gefüllt
- [ ] Current Sprint ist gesetzt (001-010)

**Weiter**: 049

---

## 049 Testing: Unit Tests Setup (optional)

**Ziel**: Unit-Test-Infrastruktur einrichten.

**ToDo**:
- Installiere `vitest` + `@testing-library/react`
- Erstelle `vitest.config.ts`
- Erstelle Beispiel-Tests:
  - `src/hooks/__tests__/useAuth.test.ts`
  - `src/components/__tests__/Button.test.tsx`
- Dokumentiere Test-Strategie in `docs/TESTING.md`

**Output**:
- `vitest.config.ts`
- `src/hooks/__tests__/useAuth.test.ts`
- `src/components/__tests__/Button.test.tsx`
- `docs/TESTING.md`

**Checks**:
- [ ] Tests laufen mit `npm run test`
- [ ] Beispiel-Tests sind grün
- [ ] Coverage-Report funktioniert

**Weiter**: 050

---

## 050 Testing: Integration Tests (optional)

**Ziel**: Integration-Tests für kritische User-Flows.

**ToDo**:
- Erstelle E2E-Tests mit `playwright` oder `cypress`:
  - Test 1: User Registration & Login
  - Test 2: Organisation erstellen & Projekt erstellen
  - Test 3: Finder Felix Workflow triggern
  - Test 4: E-Mail generieren & versenden
- Dokumentiere in `docs/TESTING.md`

**Output**:
- `tests/e2e/auth.spec.ts`
- `tests/e2e/workflow.spec.ts`
- Update: `docs/TESTING.md`

**Checks**:
- [ ] E2E-Tests laufen lokal
- [ ] Kritische Flows sind abgedeckt

**Weiter**: 051

---

## 051 Deployment: Lovable Cloud Production

**Ziel**: App auf Lovable Cloud deployen.

**ToDo**:
- Prüfe `package.json` Build-Scripts: `vite build`
- Prüfe Supabase Migrations: Alle angewendet?
- Deploy über Lovable UI: "Publish" Button
- Prüfe Production-URL
- Teste Haupt-Features live:
  - Login/Registrierung
  - Organisation/Projekt erstellen
  - Workflow triggern (mit n8n-Integration)
  - E-Mail versenden

**Output**:
- Deployment erfolgt
- `docs/DEPLOYMENT.md` mit Production-URL

**Checks**:
- [ ] App ist live erreichbar
- [ ] Haupt-Features funktionieren in Production
- [ ] Keine Console-Errors

**Weiter**: 052

---

## 052 Handover & Final Checks

**Ziel**: Projekt-Übergabe vorbereiten und finale Checks durchführen.

**ToDo**:
- Erstelle `docs/HANDOVER.md`:
  - Projekt-Übersicht
  - Technologie-Stack
  - Deployment-Prozess
  - n8n-Workflows-Setup-Anleitung
  - Zugänge & Secrets (falls relevant)
- Finale Checkliste:
  - Alle Tasks abgeschlossen?
  - Alle Docs aktualisiert?
  - Security-Scan durchgeführt?
  - Performance-Check durchgeführt?
  - Backup-Strategie dokumentiert?
- Optional: Video-Tutorial aufnehmen

**Output**:
- `docs/HANDOVER.md`
- `docs/FINAL_CHECKLIST.md`

**Checks**:
- [ ] Alle Tasks sind auf "Done"
- [ ] PROGRESS_LOG.md ist aktualisiert
- [ ] Handover-Dokumentation ist vollständig
- [ ] Projekt ist produktionsbereit

**Weiter**: —

---

## 📊 Zusammenfassung

**Gesamt-Tasks**: 52  
**Geschätzte Aufwand**: ~120-150 Stunden (abhängig von Komplexität & Team-Größe)

**Kritische Pfade**:
1. Setup & Backend (001-012) – 20-30h
2. Auth & Org/Projekt (013-022) – 20-25h
3. Workflows & Companies (023-031) – 25-30h
4. E-Mails & UI/UX (032-041) – 30-35h
5. Polish & Deployment (042-052) – 15-20h

**Abhängigkeiten**:
- n8n-Workflows müssen parallel konfiguriert werden (separate Dokumentation: `docs/N8N_SETUP.md`)
- Lovable Cloud muss frühzeitig aktiviert sein (Task 001)
- Feature Library Patterns werden durchgängig referenziert

---

**Versionskontrolle**: Diese BUILD_PROMPTS.md sollte bei Änderungen an SOFTWARE_DOKU.md aktualisiert werden.

**Nächste Schritte**: PROGRESS_LOG.md initialisieren (Task 048) und mit Task 001 beginnen.
