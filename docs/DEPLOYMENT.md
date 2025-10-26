# Deployment Guide - Cold Calling App

**Version**: 1.0  
**Stand**: 2025-10-26  
**Projekt**: Cold Calling Automatisierungs-Plattform

---

## 📖 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Voraussetzungen](#voraussetzungen)
3. [Lokale Entwicklung](#lokale-entwicklung)
4. [Supabase Setup](#supabase-setup)
5. [n8n Workflows Setup](#n8n-workflows-setup)
6. [Lovable Deployment](#lovable-deployment)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Rollback-Prozedur](#rollback-prozedur)

---

## Übersicht

Die Cold Calling App besteht aus drei Hauptkomponenten:

1. **Frontend**: Lovable React App (gehostet auf Lovable Cloud)
2. **Backend**: Supabase (externe Instanz)
3. **Workflows**: n8n (selbst-gehostet oder Cloud)

Dieser Guide beschreibt den vollständigen Deployment-Prozess für alle Komponenten.

---

## Voraussetzungen

### Erforderliche Tools

- **Node.js**: Version 18.x oder höher
- **npm/bun**: Paketmanager (bun empfohlen für schnellere Builds)
- **Git**: Für Versionskontrolle
- **Supabase CLI** (optional): Für lokale Entwicklung

### Erforderliche Accounts

- **Lovable Account**: Für Frontend-Hosting
- **Supabase Account**: Bereits konfiguriert (Projekt: fttdfvnhghbgtawkslau)
- **n8n Account/Instance**: Für Workflow-Automatisierung

### Environment Variables

Folgende Secrets müssen in Supabase konfiguriert sein:

```bash
N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.app
N8N_WEBHOOK_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
```

---

## Lokale Entwicklung

### 1. Repository klonen

```bash
git clone <repository-url>
cd cold-calling-app
```

### 2. Dependencies installieren

```bash
bun install
# oder
npm install
```

### 3. Environment konfigurieren

Die Supabase-Credentials sind bereits in `src/integrations/supabase/client.ts` konfiguriert:

```typescript
const SUPABASE_URL = "https://fttdfvnhghbgtawkslau.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

> ⚠️ **Wichtig**: Diese Credentials sind für Development und Production identisch.

### 4. Development Server starten

```bash
bun run dev
# oder
npm run dev
```

Die App ist dann verfügbar unter: `http://localhost:8080`

### 5. Lokale Tests

```bash
# Type checking
bun run type-check

# Build testen
bun run build

# Preview des Builds
bun run preview
```

---

## Supabase Setup

### 1. Datenbank-Migrations

Alle Migrations befinden sich in `supabase/migrations/`.

**Migrations anwenden:**

1. Öffne Supabase Dashboard: https://supabase.com/dashboard/project/fttdfvnhghbgtawkslau
2. Navigiere zu **SQL Editor**
3. Führe alle SQL-Dateien in chronologischer Reihenfolge aus

**Oder via CLI:**

```bash
# Supabase CLI installieren
npm install -g supabase

# Mit Projekt verbinden
supabase link --project-ref fttdfvnhghbgtawkslau

# Migrations pushen
supabase db push
```

### 2. Row Level Security (RLS) prüfen

Stelle sicher, dass RLS für alle Tabellen aktiviert ist:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Alle Tabellen sollten `rowsecurity = true` haben.

### 3. Realtime aktivieren

Realtime muss für `n8n_workflow_states` aktiviert sein:

```sql
-- Check if Realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Should include: n8n_workflow_states
```

### 4. Secrets konfigurieren

Im Supabase Dashboard unter **Settings > Edge Functions > Secrets**:

```
N8N_WEBHOOK_BASE_URL=<your-n8n-url>
N8N_WEBHOOK_SECRET=<your-secret>
OPENAI_API_KEY=<your-key>
```

### 5. Edge Functions deployen

```bash
# Edge Function deployen
supabase functions deploy trigger-n8n-workflow

# Secrets setzen
supabase secrets set N8N_WEBHOOK_BASE_URL=https://...
supabase secrets set N8N_WEBHOOK_SECRET=...
supabase secrets set OPENAI_API_KEY=...
```

---

## n8n Workflows Setup

### 1. n8n Instance einrichten

**Option A: n8n Cloud**
1. Erstelle einen Account auf https://n8n.io
2. Notiere deine Webhook-URL: `https://your-instance.app.n8n.cloud`

**Option B: Self-Hosted**
```bash
# Docker Installation
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Workflows importieren

1. Öffne n8n UI
2. Navigiere zu **Workflows > Import from File**
3. Importiere folgende JSON-Dateien:
   - `docs/Analyse_Anna__Datenanalystin_(1).json`
   - `docs/Felix__Praktikant_Aktualisiert.json`
   - `docs/Pitch_Paul__Vertriebler_.json`

### 3. Webhooks konfigurieren

Für jeden Workflow:

1. Öffne den Workflow
2. Klicke auf den "Webhook"-Node
3. Konfiguriere:
   - **HTTP Method**: POST
   - **Path**: `/webhook/[workflow-name]`
   - **Authentication**: Header Auth
   - **Header Name**: `x-n8n-webhook-secret`
   - **Header Value**: `{{$env.N8N_WEBHOOK_SECRET}}`

### 4. Supabase Credentials in n8n

Erstelle in n8n unter **Credentials** einen neuen "Supabase"-Credential:

```
Host: https://fttdfvnhghbgtawkslau.supabase.co
Service Role Key: <von Supabase Dashboard>
```

### 5. Workflows aktivieren

Aktiviere alle drei Workflows in n8n.

### 6. Webhook-URLs dokumentieren

Trage die Webhook-URLs in `docs/N8N_WEBHOOKS.md` ein:

```markdown
- Finder Felix: https://your-n8n.app/webhook/finder-felix
- Analyse Anna: https://your-n8n.app/webhook/analyse-anna
- Pitch Paul: https://your-n8n.app/webhook/pitch-paul
- Email Sender: https://your-n8n.app/webhook/email-sender
```

---

## Lovable Deployment

### 1. Lovable Project erstellen

Falls noch nicht vorhanden:

1. Gehe zu https://lovable.dev
2. Erstelle ein neues Projekt
3. Verbinde mit diesem Repository

### 2. Supabase Integration

Die Supabase-Integration ist bereits konfiguriert in:
- `src/integrations/supabase/client.ts`
- `supabase/config.toml`

> ℹ️ **Hinweis**: Lovable erkennt die Supabase-Konfiguration automatisch.

### 3. Build & Deploy

**Automatisch:**
- Jeder Push zu `main` triggert automatisch einen Build
- Lovable deployed automatisch nach erfolgreichem Build

**Manuell:**
1. Öffne Lovable Dashboard
2. Klicke auf **"Publish"**
3. Wähle **"Production"**
4. Klicke auf **"Deploy"**

### 4. Domain konfigurieren (optional)

1. Navigiere zu **Settings > Domains**
2. Klicke auf **"Add Custom Domain"**
3. Folge den Anweisungen für DNS-Konfiguration

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Alle Migrations sind applied
- [ ] RLS ist auf allen Tabellen aktiviert
- [ ] Edge Functions sind deployed
- [ ] n8n Workflows sind aktiviert
- [ ] Secrets sind in Supabase konfiguriert
- [ ] Tests sind grün
- [ ] Build funktioniert lokal (`bun run build`)

### Deployment-Prozess

#### 1. Pre-Production Tests

```bash
# Build testen
bun run build

# Type-Check
bun run type-check

# Preview testen
bun run preview
```

#### 2. Backup erstellen

**Supabase Backup:**
1. Gehe zu Supabase Dashboard
2. **Settings > Database > Backups**
3. Erstelle manuellen Backup

**n8n Backup:**
1. Exportiere alle Workflows als JSON
2. Speichere in `backups/n8n-workflows-[date].zip`

#### 3. Deploy auf Lovable

```bash
# Push zu main branch
git push origin main

# Warte auf automatischen Build
# Oder manuell in Lovable Dashboard deployen
```

#### 4. Post-Deployment Tests

##### Smoke Tests

1. **Login funktioniert**
   - Gehe zu `/auth`
   - Melde dich mit Test-User an

2. **Dashboard lädt**
   - Gehe zu `/dashboard`
   - Überprüfe KPI-Cards

3. **Workflows funktionieren**
   - Starte Finder Felix mit Test-Query
   - Überprüfe Workflow-Status

4. **Realtime funktioniert**
   - Öffne zwei Browser-Tabs
   - Starte Workflow in Tab 1
   - Überprüfe Status-Update in Tab 2

##### Integration Tests

```bash
# Test Supabase Connection
curl -X GET \
  "https://fttdfvnhghbgtawkslau.supabase.co/rest/v1/profiles?select=*" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <user-jwt>"

# Test Edge Function
curl -X POST \
  "https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/trigger-n8n-workflow" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"workflowName":"finder_felix","projectId":"...","userId":"...","data":{"search_query":"test"}}'

# Test n8n Webhook
curl -X POST \
  "https://your-n8n.app/webhook/finder-felix" \
  -H "x-n8n-webhook-secret: <secret>" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"...","user_id":"...","search_query":"test"}'
```

#### 5. Performance Check

1. **Lighthouse Audit** (in Chrome DevTools):
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90

2. **Supabase Metrics**:
   - Dashboard > Observability
   - Prüfe Query-Performance
   - Prüfe Active Connections

3. **n8n Metrics**:
   - Prüfe Workflow-Execution-Times
   - Prüfe Error-Rate

---

## Monitoring & Logging

### Supabase Monitoring

#### Database Logs

```sql
-- Query Slow Queries
SELECT 
  queryid,
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### Realtime Logs

Dashboard: **Observability > Realtime Logs**

#### Edge Function Logs

Dashboard: **Edge Functions > [function-name] > Logs**

### n8n Monitoring

#### Workflow Logs

1. Öffne n8n UI
2. **Executions** Tab
3. Filter nach Status (failed, running)

#### Webhook Monitoring

```bash
# Check webhook endpoint
curl -X POST https://your-n8n.app/webhook/finder-felix \
  -H "x-n8n-webhook-secret: wrong-secret" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 401 Unauthorized
```

### Frontend Monitoring

#### Console Logs

Lovable bietet automatische Error-Tracking in:
- **Dashboard > Logs**
- **Dashboard > Analytics**

#### Custom Logging

```typescript
// In production, logs werden automatisch an Lovable gesendet
console.error('Critical error:', error);
console.warn('Warning:', warning);
```

---

## Troubleshooting

### Problem: App lädt nicht

**Diagnose:**
```bash
# Check Supabase Status
curl https://fttdfvnhghbgtawkslau.supabase.co/rest/v1/

# Check DNS
nslookup your-domain.com
```

**Lösung:**
- Überprüfe Lovable Deployment-Status
- Überprüfe Supabase-Credentials
- Cache leeren: `Ctrl+Shift+R`

### Problem: Login funktioniert nicht

**Diagnose:**
```javascript
// In Browser Console
supabase.auth.getSession()
```

**Lösung:**
- Überprüfe Supabase Auth-Settings
- Stelle sicher, dass Email-Confirmation deaktiviert ist
- Überprüfe RLS-Policies auf `profiles` Tabelle

### Problem: Workflow schlägt fehl

**Diagnose:**
1. Öffne n8n Executions
2. Klicke auf failed Execution
3. Prüfe Error-Message

**Häufige Fehler:**
- **401 Unauthorized**: `N8N_WEBHOOK_SECRET` stimmt nicht überein
- **500 Server Error**: n8n-Workflow hat einen Fehler (z.B. API-Key ungültig)
- **Timeout**: Workflow dauert zu lange (> 60s)

**Lösung:**
- Überprüfe Secrets in Supabase
- Überprüfe n8n Credentials (Supabase, OpenAI)
- Reduziere Workflow-Komplexität

### Problem: Realtime funktioniert nicht

**Diagnose:**
```javascript
// In Browser Console
const channel = supabase
  .channel('test')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'n8n_workflow_states' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```

**Lösung:**
- Überprüfe, ob Realtime für Tabelle aktiviert ist
- Überprüfe RLS-Policies (User muss Zugriff auf Rows haben)
- Überprüfe `REPLICA IDENTITY` ist auf `FULL`

### Problem: Edge Function Timeout

**Diagnose:**
```bash
# Check Edge Function Logs
# In Supabase Dashboard: Edge Functions > Logs
```

**Lösung:**
- Reduziere Webhook-Payload-Größe
- Nutze asynchrone Verarbeitung (Webhook nur zum Triggern)
- Erhöhe Timeout (max. 60s in Supabase)

---

## Rollback-Prozedur

### Frontend Rollback

**Option 1: Lovable UI**
1. Öffne Lovable Dashboard
2. **History** Tab
3. Klicke auf vorherige Version
4. Klicke auf **"Revert"**

**Option 2: Git**
```bash
# Rollback zu vorheriger Version
git revert HEAD
git push origin main

# Lovable deployed automatisch
```

### Database Rollback

**Wichtig:** Datenbank-Rollbacks sind komplex und sollten vermieden werden.

**Point-in-Time Recovery:**
1. Supabase Dashboard
2. **Settings > Database > Backups**
3. Wähle Backup aus
4. **"Restore"**

> ⚠️ **Warnung**: Alle Änderungen seit dem Backup gehen verloren!

**Alternative: Revert Migration**
```bash
# Revert letzte Migration
supabase db reset --db-url <connection-string>
```

### n8n Rollback

**Workflow Rollback:**
1. n8n UI öffnen
2. **Workflows > [workflow-name]**
3. **Workflow History** (falls aktiviert)
4. Wähle vorherige Version
5. **"Restore"**

**Manuell:**
1. Deaktiviere aktuellen Workflow
2. Importiere Backup-JSON
3. Aktiviere Backup-Workflow

---

## Security Best Practices

### 1. Secrets Management

- **Nie** Secrets in Git committen
- Nutze Supabase Secrets für Edge Functions
- Nutze n8n Environment Variables
- Rotiere Secrets regelmäßig (alle 90 Tage)

### 2. RLS Policies

- Alle Tabellen müssen RLS haben
- Teste Policies mit verschiedenen User-Rollen
- Nutze `SECURITY DEFINER` Functions für komplexe Checks

### 3. CORS Configuration

Supabase CORS ist standardmäßig konfiguriert.

Für Custom Domains:
1. Supabase Dashboard
2. **Settings > API > CORS**
3. Füge Domain hinzu

### 4. Rate Limiting

Implementiere Rate-Limiting im Frontend:

```typescript
// Beispiel: Max 5 Workflow-Starts pro Minute
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(t => now - t < 60000);
  
  if (recentRequests.length >= 5) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

---

## Performance Optimization

### Database

1. **Indizes prüfen:**
```sql
-- Check missing indexes
SELECT 
  schemaname, 
  tablename, 
  attname, 
  null_frac, 
  avg_width, 
  n_distinct
FROM pg_stats
WHERE schemaname = 'public';
```

2. **Query-Optimierung:**
   - Nutze `.select()` mit spezifischen Feldern
   - Nutze Pagination (`.range()`)
   - Vermeide `SELECT *`

### Frontend

1. **Code Splitting:**
```typescript
// Lazy load heavy components
const CompanyDetail = lazy(() => import('@/pages/CompanyDetail'));
```

2. **Image Optimization:**
   - Nutze WebP Format
   - Lazy load images
   - Nutze responsive images

3. **Caching:**
```typescript
// React Query caching
const { data } = useQuery({
  queryKey: ['companies', projectId],
  queryFn: fetchCompanies,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Changelog

### 2025-10-26

- Initial Deployment Guide erstellt
- Alle Deployment-Schritte dokumentiert
- Troubleshooting-Sektion hinzugefügt
- Rollback-Prozeduren definiert
- Security & Performance Best Practices hinzugefügt
