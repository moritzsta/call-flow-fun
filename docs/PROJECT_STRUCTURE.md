# PROJECT_STRUCTURE.md

**Projekt:** Cold Calling Automatisierungs-Plattform  
**Stack:** Lovable (React, Vite, Tailwind), Supabase (externe Datenbank), n8n Workflows  
**Stand:** 2025-10-25

---

## 📂 Verzeichnisstruktur

```
/
├── docs/                           # Projektdokumentation
│   ├── BUILD_PROMPTS.md            # Task-Definitionen & Umsetzungsplan
│   ├── PROGRESS_LOG.md             # Status-Tracking & Milestones
│   ├── SOFTWARE_DOKU.md            # Technische Spezifikation
│   ├── STYLE_GUIDE.md              # Design System & Accessibility
│   ├── PROJECT_STRUCTURE.md        # Diese Datei
│   ├── N8N_WEBHOOKS.md             # Webhook-Endpunkte (wird in Task 002 erstellt)
│   └── feature-library/            # Wiederverwendbare Patterns
│       ├── 00-Feature-Library-Overview.md
│       ├── 01-Auth-Profile-Pattern.md
│       ├── 02-Subscription-Feature-Gating-Pattern.md
│       ├── 03-Security-Pattern.md
│       ├── 04-KI-Integration-Pattern.md
│       ├── 05-Datenstruktur-Pattern.md
│       ├── 06-UI-UX-Pattern.md
│       ├── 07-Communication-Realtime-Pattern.md
│       └── 08-Advanced-Sharing-Pattern.md
│
├── public/                         # Statische Assets
│   ├── robots.txt
│   └── placeholder.svg
│
├── src/                            # Hauptquellcode
│   ├── components/                 # React Components
│   │   ├── ui/                     # shadcn/ui Base Components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (weitere shadcn Components)
│   │   │
│   │   ├── auth/                   # Auth-spezifische Components
│   │   │   ├── AuthProvider.tsx    # Auth Context & State Management
│   │   │   ├── ProtectedRoute.tsx  # Route Guards
│   │   │   └── LoginForm.tsx       # Login/Signup Forms
│   │   │
│   │   ├── organizations/          # Organisations-Management
│   │   │   ├── OrganizationCard.tsx
│   │   │   ├── OrganizationSettings.tsx
│   │   │   └── MemberManagement.tsx
│   │   │
│   │   ├── projects/               # Projekt-Management
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectDashboard.tsx
│   │   │   └── ProjectSettings.tsx
│   │   │
│   │   ├── companies/              # Firmen-Verwaltung
│   │   │   ├── CompanyList.tsx
│   │   │   ├── CompanyCard.tsx
│   │   │   ├── CompanyDetail.tsx
│   │   │   └── CompanyFilters.tsx
│   │   │
│   │   ├── emails/                 # E-Mail-Management
│   │   │   ├── EmailList.tsx
│   │   │   ├── EmailCard.tsx
│   │   │   ├── EmailDetail.tsx
│   │   │   ├── EmailEditor.tsx
│   │   │   └── SendEmailButton.tsx
│   │   │
│   │   ├── workflows/              # n8n Workflow-Integration
│   │   │   ├── FinderFelixDialog.tsx
│   │   │   ├── AnalyseAnnaDialog.tsx
│   │   │   ├── PitchPaulDialog.tsx
│   │   │   ├── WorkflowStatusBadge.tsx
│   │   │   └── WorkflowProgress.tsx
│   │   │
│   │   └── layout/                 # Layout Components
│   │       ├── Navigation.tsx
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   │
│   ├── hooks/                      # Custom React Hooks
│   │   ├── use-auth.ts             # Auth State & Methods
│   │   ├── use-organizations.ts    # Organization CRUD
│   │   ├── use-projects.ts         # Project CRUD
│   │   ├── use-companies.ts        # Company CRUD
│   │   ├── use-emails.ts           # Email CRUD
│   │   ├── use-workflow-trigger.ts # n8n Webhook Calls
│   │   ├── use-workflow-status.ts  # Realtime Workflow Status
│   │   ├── use-mobile.tsx          # Mobile Detection
│   │   └── use-toast.ts            # Toast Notifications (shadcn)
│   │
│   ├── lib/                        # Utility Functions & Helpers
│   │   ├── utils.ts                # General Utilities (cn, etc.)
│   │   ├── validations.ts          # Zod Schemas
│   │   ├── constants.ts            # App Constants
│   │   └── api/                    # API Helper Functions
│   │       ├── organizations.ts
│   │       ├── projects.ts
│   │       ├── companies.ts
│   │       ├── emails.ts
│   │       └── workflows.ts
│   │
│   ├── integrations/               # Externe Integrationen
│   │   └── supabase/
│   │       ├── client.ts           # Supabase Client
│   │       └── types.ts            # Auto-generierte DB Types
│   │
│   ├── pages/                      # Page Components (React Router)
│   │   ├── Index.tsx               # Landing/Dashboard
│   │   ├── Auth.tsx                # Login/Signup Page
│   │   ├── Organizations.tsx       # Organisations-Übersicht
│   │   ├── OrganizationDetail.tsx  # Organisation Detail
│   │   ├── Projects.tsx            # Projekt-Übersicht
│   │   ├── ProjectDashboard.tsx    # Projekt Dashboard
│   │   ├── ProjectCompanies.tsx    # Firmen-Liste (pro Projekt)
│   │   ├── CompanyDetail.tsx       # Firmen-Detail
│   │   ├── ProjectEmails.tsx       # E-Mail-Liste (pro Projekt)
│   │   ├── EmailDetail.tsx         # E-Mail-Detail
│   │   ├── ProfileSettings.tsx     # User-Profil-Einstellungen
│   │   └── NotFound.tsx            # 404 Page
│   │
│   ├── App.tsx                     # Root Component mit Routing
│   ├── App.css                     # Global Styles (minimal)
│   ├── index.css                   # Tailwind Base + HSL Tokens
│   ├── main.tsx                    # Entry Point
│   └── vite-env.d.ts               # Vite Type Definitions
│
├── supabase/                       # Supabase Backend
│   ├── config.toml                 # Supabase Projekt-Config
│   ├── migrations/                 # SQL Migrations (werden erstellt)
│   │   ├── YYYYMMDD_create_enums.sql
│   │   ├── YYYYMMDD_create_profiles.sql
│   │   ├── YYYYMMDD_create_organizations.sql
│   │   ├── YYYYMMDD_create_projects.sql
│   │   ├── YYYYMMDD_create_companies.sql
│   │   ├── YYYYMMDD_create_project_emails.sql
│   │   ├── YYYYMMDD_create_workflow_states.sql
│   │   └── YYYYMMDD_create_user_roles.sql
│   │
│   └── functions/                  # Edge Functions (Optional)
│       └── (wird bei Bedarf erstellt)
│
├── .env                            # Environment Variables
├── .gitignore
├── components.json                 # shadcn/ui Config
├── eslint.config.js                # ESLint Config
├── index.html                      # HTML Entry Point
├── package.json                    # NPM Dependencies
├── package-lock.json
├── postcss.config.js               # PostCSS Config
├── tailwind.config.ts              # Tailwind CSS Config
├── tsconfig.json                   # TypeScript Config
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts                  # Vite Config
```

---

## 🎯 Architektur-Übersicht

### Frontend (Lovable)
- **Framework:** React 18 mit TypeScript
- **Build Tool:** Vite (schnelles Dev-Environment)
- **Styling:** Tailwind CSS mit HSL-Tokens (siehe `STYLE_GUIDE.md`)
- **UI Library:** shadcn/ui (customizable Components)
- **State Management:** TanStack React Query (Server-State) + React Context (Auth)
- **Routing:** React Router DOM v6
- **Validierung:** Zod (Schema Validation)

### Backend (Supabase)
- **Datenbank:** PostgreSQL (externe Supabase-Instanz)
- **Auth:** Supabase Auth (Email/Password)
- **RLS:** Row Level Security für Owner-/Rollen-basierte Zugriffskontrolle
- **Realtime:** Supabase Realtime für Workflow-Status-Updates
- **Storage:** (Optional) Supabase Storage für Dateien

### Workflows (n8n)
- **Finder Felix:** Webscraping für Firmendaten
- **Analyse Anna:** KI-basierte Webseitenanalyse
- **Pitch Paul:** Personalisierte E-Mail-Generierung
- **E-Mail-Versand:** Dedizierter Workflow für E-Mail-Delivery

---

## 🔐 Sicherheitskonzept

### Row Level Security (RLS)
- **Owner-Isolation:** `owner_id = auth.uid()`
- **Projekt-Isolation:** `project_id` mit `has_project_role()` Function
- **Rollen-basiert:** `owner`, `manager`, `read_only` via `user_roles` Tabelle
- **SECURITY DEFINER:** Funktionen für Admin-Checks ohne RLS-Rekursion

### Authentifizierung
- **Supabase Auth:** JWT-basierte Session-Verwaltung
- **Protected Routes:** `ProtectedRoute` Component mit `useAuth` Hook
- **n8n Webhooks:** Secret-basierte Signature Verification

📘 **Reuse:** feature/03-security-pattern

---

## 📊 Datenmodell-Übersicht

### Core Entities
- **users** (Supabase Auth) → **profiles** (erweitert)
- **organizations** → **organization_members** (Many-to-Many)
- **projects** (gehört zu Organization)
- **companies** (gehört zu Project)
- **project_emails** (gehört zu Project & Company)
- **n8n_workflow_states** (Workflow-Status pro Project)
- **user_roles** (Rollen-Verwaltung, separiert)

### Lookup-Tabellen
- **german_cities** (vollständig gefüllt)
- **german_districts** (vollständig gefüllt)

📘 **Reuse:** feature/05-datenstruktur-pattern

---

## 🚀 Deployment & Environments

### Development
- **Frontend:** `npm run dev` (Vite Dev Server)
- **Backend:** Supabase-Instanz (bereits verbunden)
- **Hot Reload:** Automatisch via Vite

### Production
- **Frontend:** Lovable Publish → CDN
- **Backend:** Externe Supabase-Instanz (Produktion)
- **n8n:** Separate n8n-Instanz (muss parallel konfiguriert werden)

---

## 📦 Dependencies

### Hauptabhängigkeiten (bereits installiert)
```json
{
  "@supabase/supabase-js": "^2.76.1",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "zod": "^3.25.76",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4",
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0"
}
```

### shadcn/ui Components
- Alle UI-Components werden über `components/ui/` verwaltet
- Customization erfolgt in `tailwind.config.ts` und `index.css`

📘 **Reuse:** feature/06-ui-ux-pattern

---

## 🧪 Testing-Strategie (Optional)

### Unit Tests
- **Framework:** Vitest (wird in Task 049 eingerichtet)
- **Coverage:** Hooks, Utility Functions

### Integration Tests
- **Framework:** Playwright oder Cypress (wird in Task 050 eingerichtet)
- **Fokus:** Kritische User-Flows (Auth, Workflows, E-Mail-Versand)

---

## 📝 Coding Standards

### TypeScript
- **Strict Mode:** aktiviert
- **ESLint:** konfiguriert (siehe `eslint.config.js`)
- **Type-Safety:** Alle API-Responses typisiert via `supabase/types.ts`

### React
- **Functional Components:** mit TypeScript Interfaces
- **Custom Hooks:** für wiederverwendbare Logik
- **Error Boundaries:** für robustes Error-Handling (Task 041)

### Styling
- **Tailwind:** Semantic Tokens (HSL) aus `index.css`
- **Keine Inline-Styles:** Alles via Tailwind-Klassen
- **Design System:** Zentralisiert in `STYLE_GUIDE.md`

📘 **Reuse:** feature/06-ui-ux-pattern

---

## 🔄 Workflow-Integration

### n8n Webhook-Endpunkte (Task 002)
- `/webhook/finder-felix` → Finder Felix starten
- `/webhook/analyse-anna` → Analyse Anna starten
- `/webhook/pitch-paul-generate` → Pitch Paul starten
- `/webhook/email-sender` → Einzelne E-Mail versenden
- `/webhook/email-sender-batch` → Batch E-Mails versenden

### Realtime-Updates (Task 028)
- `n8n_workflow_states` Tabelle mit Realtime aktiviert
- Frontend subscribed zu Workflow-Status-Änderungen
- UI aktualisiert sich automatisch (z.B. Progress-Bar)

📘 **Reuse:** feature/07-communication-realtime-pattern

---

## 📚 Weitere Dokumentation

- **BUILD_PROMPTS.md:** Alle 52 Tasks mit Checks & Weiter-Links
- **PROGRESS_LOG.md:** Status-Board, Milestones, Change Log
- **SOFTWARE_DOKU.md:** Vollständige technische Spezifikation
- **STYLE_GUIDE.md:** Design-System, Farben, Typografie, A11y
- **Feature Library:** 8 Pattern-Dokumente mit Code-Beispielen

---

**Version:** 1.0  
**Erstellt:** 2025-10-25  
**Status:** Initial Setup (Task 001)
