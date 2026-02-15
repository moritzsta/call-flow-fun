

# Supabase-Verbindung auf lokale Instanz umstellen

## Ausgangslage
Das Projekt ist aktuell mit der gehosteten Supabase-Instanz (`fttdfvnhghbgtawkslau.supabase.co`) verbunden. Du moechtest auf deine lokale Instanz unter `https://xoe8312g4177ugoq.myfritz.net` mit dem Schema `projekt_b` wechseln.

## Wichtiger Hinweis
Die Datei `src/integrations/supabase/client.ts` wird von Lovable automatisch generiert und kann bei Aenderungen ueberschrieben werden. Daher erstellen wir einen **separaten, manuellen Client**, der den auto-generierten ersetzt.

## Aenderungen

### 1. Neuen Supabase-Client erstellen
**Neue Datei:** `src/lib/supabaseClient.ts`

Ein eigener Client mit den neuen Verbindungsdaten:
- URL: `https://xoe8312g4177ugoq.myfritz.net`
- Anon Key: der bereitgestellte Key
- Schema: `projekt_b`
- Auth-Konfiguration bleibt gleich (localStorage, persistSession, autoRefreshToken)

### 2. Alle Imports umstellen
Alle Dateien, die aktuell `import { supabase } from "@/integrations/supabase/client"` nutzen, werden auf `import { supabase } from "@/lib/supabaseClient"` umgestellt.

Betroffene Bereiche:
- `src/contexts/AuthContext.tsx`
- Alle Hooks (`src/hooks/useCompanies.ts`, `useEmails.ts`, `useProjects.ts`, etc.)
- Alle Komponenten mit direktem Supabase-Zugriff (Import, Export, etc.)
- Edge Functions bleiben unveraendert (die nutzen serverseitige Secrets)

### 3. Edge Functions
Die Edge Functions (z.B. `trigger-n8n-workflow`, `advance-pipeline`) nutzen eigene Secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Diese muessen separat in deiner lokalen Supabase-Instanz konfiguriert werden, falls du sie weiterhin nutzen moechtest. Alternativ muessen die Secrets in Lovable aktualisiert werden.

## Technische Details

```text
Vorher:
  App --> integrations/supabase/client.ts --> fttdfvnhghbgtawkslau.supabase.co (Schema: public)

Nachher:
  App --> lib/supabaseClient.ts --> xoe8312g4177ugoq.myfritz.net (Schema: projekt_b)
```

### Schema-Unterschied
Du verwendest das Schema `projekt_b` statt `public`. Das bedeutet:
- Alle Tabellennamen bleiben gleich, aber Supabase greift auf `projekt_b.*` statt `public.*` zu
- RLS-Policies, Funktionen und Trigger muessen im Schema `projekt_b` existieren
- Die TypeScript-Typen in `types.ts` muessen ggf. angepasst werden, falls sich die Tabellenstruktur unterscheidet

### Risiken
- Die auto-generierte `types.ts` spiegelt das alte Schema wider. Wenn die Tabellenstruktur in `projekt_b` abweicht, koennen TypeScript-Fehler auftreten
- CORS muss auf deiner lokalen Instanz korrekt konfiguriert sein, damit der Browser-Client zugreifen kann
- SSL-Zertifikat fuer `myfritz.net` muss gueltig sein

