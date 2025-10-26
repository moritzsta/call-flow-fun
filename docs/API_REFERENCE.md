# API Reference - Cold Calling App

**Version**: 1.0  
**Stand**: 2025-10-26  
**Projekt**: Cold Calling Automatisierungs-Plattform

---

## 📖 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Authentifizierung](#authentifizierung)
3. [Supabase Client API](#supabase-client-api)
4. [Edge Functions](#edge-functions)
5. [n8n Webhooks](#n8n-webhooks)
6. [Realtime Subscriptions](#realtime-subscriptions)
7. [React Hooks API](#react-hooks-api)
8. [Type Definitions](#type-definitions)

---

## Übersicht

Die Cold Calling App nutzt folgende APIs:

- **Supabase Client API**: Für Datenbank-Zugriff, Auth, Storage
- **Edge Functions**: Serverless Functions für Webhook-Integration
- **n8n Webhooks**: Externe Workflow-Trigger
- **Realtime API**: Für Live-Updates (Workflow-Status)

### Base URLs

```
Supabase URL: https://fttdfvnhghbgtawkslau.supabase.co
Edge Functions: https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/
n8n Webhooks: [Siehe N8N_WEBHOOKS.md]
```

---

## Authentifizierung

### Supabase Auth

Die App nutzt Supabase Auth für Benutzer-Authentifizierung.

#### Sign Up

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});
```

**Response:**
```typescript
{
  user: User | null,
  session: Session | null,
  error: AuthError | null
}
```

#### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
});
```

#### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

#### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

---

## Supabase Client API

### Organizations

#### Create Organization

```typescript
const { data, error } = await supabase
  .from('organizations')
  .insert({
    name: 'My Organization',
    description: 'Description',
    owner_id: user.id
  })
  .select()
  .single();
```

#### Get Organizations (with Members)

```typescript
const { data, error } = await supabase
  .from('organizations')
  .select(`
    *,
    organization_members!inner(
      user_id,
      role
    )
  `)
  .eq('organization_members.user_id', user.id);
```

#### Update Organization

```typescript
const { data, error } = await supabase
  .from('organizations')
  .update({ name: 'New Name', description: 'New Description' })
  .eq('id', organizationId)
  .select()
  .single();
```

#### Delete Organization

```typescript
const { error } = await supabase
  .from('organizations')
  .delete()
  .eq('id', organizationId);
```

### Projects

#### Create Project

```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    organization_id: organizationId,
    title: 'My Project',
    description: 'Description'
  })
  .select()
  .single();
```

#### Get Projects by Organization

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('archived', false)
  .order('created_at', { ascending: false });
```

#### Archive Project

```typescript
const { data, error } = await supabase
  .from('projects')
  .update({ archived: true })
  .eq('id', projectId)
  .select()
  .single();
```

### Companies

#### Get Companies by Project

```typescript
const { data, error } = await supabase
  .from('companies')
  .select(`
    id, company, industry, ceo_name, phone, email, website,
    address, district, city, state, status, created_at
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

#### Get Single Company (with Analysis)

```typescript
const { data, error } = await supabase
  .from('companies')
  .select('*')
  .eq('id', companyId)
  .single();
```

#### Update Company Status

```typescript
const { data, error } = await supabase
  .from('companies')
  .update({ status: 'analyzed' })
  .eq('id', companyId)
  .select()
  .single();
```

#### Filter Companies

```typescript
const { data, error } = await supabase
  .from('companies')
  .select('*')
  .eq('project_id', projectId)
  .eq('status', 'analyzed')  // Optional: Filter by status
  .eq('state', 'Bayern')     // Optional: Filter by state
  .ilike('company', '%search%')  // Optional: Search
  .range(from, to)           // Pagination
  .order('created_at', { ascending: false });
```

### Project Emails

#### Get Emails by Project

```typescript
const { data, error } = await supabase
  .from('project_emails')
  .select(`
    id, recipient_email, subject, status, sent_at, created_at,
    companies!project_emails_company_id_fkey(company)
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

#### Update Email Status

```typescript
const { data, error } = await supabase
  .from('project_emails')
  .update({
    status: 'sent',
    sent_at: new Date().toISOString()
  })
  .eq('id', emailId)
  .select()
  .single();
```

### Workflow States

#### Get Workflows by Project

```typescript
const { data, error } = await supabase
  .from('n8n_workflow_states')
  .select('*')
  .eq('project_id', projectId)
  .order('started_at', { ascending: false })
  .limit(20);
```

#### Create Workflow State

```typescript
const { data, error } = await supabase
  .from('n8n_workflow_states')
  .insert({
    project_id: projectId,
    user_id: userId,
    workflow_name: 'finder_felix',
    status: 'pending',
    trigger_data: { search_query: '...' },
    started_at: new Date().toISOString()
  })
  .select()
  .single();
```

---

## Edge Functions

### trigger-n8n-workflow

Triggerst n8n-Workflows und erstellt Workflow-Status-Einträge.

**Endpoint:** `POST /functions/v1/trigger-n8n-workflow`

**Headers:**
```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  workflowName: 'finder_felix' | 'analyse_anna' | 'pitch_paul' | 'email_sender',
  projectId: string,
  userId: string,
  data: {
    // Workflow-specific data
    search_query?: string,
    company_ids?: string[],
    pitch_template?: string,
    email_id?: string
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "workflowStateId": "uuid",
  "message": "Workflow successfully triggered"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Example:**
```typescript
const response = await fetch(
  'https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/trigger-n8n-workflow',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflowName: 'finder_felix',
      projectId: 'project-uuid',
      userId: 'user-uuid',
      data: {
        search_query: 'Zahnarzt in München'
      }
    })
  }
);

const result = await response.json();
```

---

## n8n Webhooks

### Webhook-Format

Alle n8n-Webhooks erwarten folgendes Format:

**Headers:**
```
x-n8n-webhook-secret: <N8N_WEBHOOK_SECRET>
Content-Type: application/json
```

**Authentication:**
- Header Auth mit `x-n8n-webhook-secret`
- Secret muss mit `N8N_WEBHOOK_SECRET` in Supabase Secrets übereinstimmen

### Workflow-Webhooks

#### Finder Felix

**Endpoint:** `POST <N8N_WEBHOOK_BASE_URL>/webhook/finder-felix`

**Payload:**
```json
{
  "project_id": "uuid",
  "user_id": "uuid",
  "workflow_state_id": "uuid",
  "search_query": "Zahnarzt in München",
  "filters": {
    "state": "Bayern",
    "city": "München",
    "district": "Schwabing"
  }
}
```

#### Analyse Anna

**Endpoint:** `POST <N8N_WEBHOOK_BASE_URL>/webhook/analyse-anna`

**Payload:**
```json
{
  "project_id": "uuid",
  "user_id": "uuid",
  "workflow_state_id": "uuid",
  "company_ids": ["uuid1", "uuid2"],
  "analysis_prompt": "Fokussiere auf Digitalisierungs-Bedarf"
}
```

#### Pitch Paul

**Endpoint:** `POST <N8N_WEBHOOK_BASE_URL>/webhook/pitch-paul`

**Payload:**
```json
{
  "project_id": "uuid",
  "user_id": "uuid",
  "workflow_state_id": "uuid",
  "company_ids": ["uuid1", "uuid2"],
  "pitch_template": "Stelle unser CRM-System vor"
}
```

#### Email Sender

**Endpoint:** `POST <N8N_WEBHOOK_BASE_URL>/webhook/email-sender`

**Payload:**
```json
{
  "email_id": "uuid",
  "recipient_email": "contact@example.com",
  "subject": "Email subject",
  "body": "Email body (HTML)"
}
```

---

## Realtime Subscriptions

### Workflow States Realtime

Subscribe to workflow status updates:

```typescript
import { supabase } from '@/integrations/supabase/client';

const channel = supabase
  .channel('workflow_states')
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'n8n_workflow_states',
      filter: `project_id=eq.${projectId}`
    },
    (payload) => {
      console.log('Workflow state changed:', payload);
      // Handle update
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## React Hooks API

### useAuth

Zugriff auf Authentifizierungs-State.

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, profile, loading, signIn, signUp, signOut } = useAuth();
```

**Returns:**
```typescript
{
  user: User | null,
  profile: Profile | null,
  loading: boolean,
  signIn: (email: string, password: string) => Promise<void>,
  signUp: (email: string, password: string, fullName: string) => Promise<void>,
  signOut: () => Promise<void>,
  refreshProfile: () => Promise<void>
}
```

### useOrganizations

Organizations CRUD operations.

```typescript
import { useOrganizations } from '@/hooks/useOrganizations';

const {
  organizations,
  isLoading,
  error,
  createOrganization,
  updateOrganization,
  deleteOrganization
} = useOrganizations();
```

**Methods:**
```typescript
createOrganization({ name: string, description?: string })
updateOrganization(id: string, { name: string, description?: string })
deleteOrganization(id: string)
```

### useProjects

Projects CRUD operations.

```typescript
import { useProjects } from '@/hooks/useProjects';

const {
  projects,
  isLoading,
  error,
  createProject,
  updateProject,
  archiveProject,
  deleteProject
} = useProjects(organizationId);
```

### useCompanies

Companies data fetching.

```typescript
import { useCompanies } from '@/hooks/useCompanies';

const {
  companies,
  totalCount,
  isLoading,
  error,
  deleteCompany,
  updateCompanyStatus
} = useCompanies(projectId, {
  search: 'search term',
  status: 'analyzed',
  state: 'Bayern',
  city: 'München'
});
```

### useEmails

Emails data fetching.

```typescript
import { useEmails } from '@/hooks/useEmails';

const {
  emails,
  totalCount,
  isLoading,
  error,
  sendEmail,
  deleteEmail
} = useEmails(projectId, {
  search: 'search term',
  status: 'ready_to_send'
});
```

### useWorkflowStatus

Workflow states with realtime updates.

```typescript
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';

const {
  workflows,
  counts,
  isLoading
} = useWorkflowStatus(projectId);
```

**Returns:**
```typescript
{
  workflows: WorkflowState[],
  counts: {
    pending: number,
    running: number,
    completed: number,
    failed: number,
    total: number
  },
  isLoading: boolean
}
```

---

## Type Definitions

### User Types

```typescript
interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  theme: string;
  created_at: string;
  updated_at: string;
}
```

### Organization Types

```typescript
interface Organization {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'read_only';
  created_at: string;
  updated_at: string;
}
```

### Project Types

```typescript
interface Project {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
```

### Company Types

```typescript
interface Company {
  id: string;
  project_id: string;
  company: string;
  industry: string;
  ceo_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  analysis: Record<string, any> | null;
  status: 'found' | 'analyzed' | 'contacted' | 'qualified' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

### Email Types

```typescript
interface ProjectEmail {
  id: string;
  project_id: string;
  company_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'draft' | 'ready_to_send' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Workflow Types

```typescript
interface WorkflowState {
  id: string;
  project_id: string;
  user_id: string;
  workflow_name: 'finder_felix' | 'analyse_anna' | 'pitch_paul' | 'email_sender';
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger_data: Record<string, any> | null;
  result_summary: Record<string, any> | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Error Handling

### Supabase Errors

```typescript
const { data, error } = await supabase.from('table').select('*');

if (error) {
  // Error handling
  console.error('Database error:', error.message);
  throw error;
}
```

### Common Error Codes

- `23505`: Unique constraint violation
- `23503`: Foreign key constraint violation
- `42501`: Insufficient privilege (RLS policy violation)
- `PGRST116`: No rows found (for `.single()` queries)

### Retry Logic

For transient errors, implement exponential backoff:

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Rate Limits

### Supabase

- **Auth**: 30 requests per hour per IP
- **Database**: No hard limit, but queries should be optimized
- **Realtime**: 200 concurrent connections per project

### n8n

- Abhängig von n8n-Konfiguration
- Empfohlen: Max 10 concurrent workflows pro User
- Rate-Limiting sollte im Frontend implementiert werden

---

## Best Practices

### 1. Error Handling

Immer Fehler abfangen und benutzerfreundliche Meldungen anzeigen:

```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Error:', error);
  toast.error('Fehler beim Laden der Daten');
  return [];
}
```

### 2. Loading States

Loading-States für bessere UX:

```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

if (isLoading) return <Skeleton />;
```

### 3. Optimistic Updates

Für bessere UX optimistische Updates verwenden:

```typescript
// Update UI immediately
setData(newData);

// Then sync with server
const { error } = await supabase.from('table').update(newData);

if (error) {
  // Rollback on error
  setData(oldData);
  toast.error('Update fehlgeschlagen');
}
```

### 4. Pagination

Für große Datensätze immer Pagination verwenden:

```typescript
const pageSize = 50;
const from = page * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .range(from, to);
```

---

## Changelog

### 2025-10-26

- Initial API Reference erstellt
- Alle Haupt-Endpunkte dokumentiert
- React Hooks API hinzugefügt
- Type Definitions vollständig
- Best Practices Sektion hinzugefügt
