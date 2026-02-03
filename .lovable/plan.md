

## Finder Felix: Erweiterte Such-Optionen

### Zusammenfassung
Der SingleFinderFelixDialog wird erweitert um:
1. **Bundesland-Suche**: User kann ein ganzes Bundesland auswählen (ohne Stadt-Pflichtfeld)
2. **Multi-Stadt-Suche**: User kann mehrere Städte auswählen, die dann im 5-Minuten-Intervall nacheinander durchsucht werden

### Architektur-Übersicht

```text
+------------------------------------------+
|     SingleFinderFelixDialog              |
+------------------------------------------+
|  [x] Bundesland-Suche                    |
|  [_] Multi-Stadt-Suche                   |
+------------------------------------------+
|                                          |
|  Bundesland: [Dropdown - Bayern]         |
|                                          |
|  Stadt: [Suche...] (deaktiviert bei      |
|          Bundesland-Suche)               |
|                                          |
|  Bei Multi-Stadt:                        |
|  [München] [x]  [Nürnberg] [x]  + ...    |
|                                          |
|  Kategorie: [________________]           |
|  Max Firmen: [___]                       |
+------------------------------------------+
```

### Neue Logik für Multi-Stadt-Suche

```text
User wählt: München, Nürnberg, Augsburg
Kategorie: "IT-Dienstleister"

Klick auf "Starten"
    ↓
DB: scheduled_felix_runs eintragen
    ├─ run_1: München, scheduled_at: NOW
    ├─ run_2: Nürnberg, scheduled_at: NOW + 5min
    └─ run_3: Augsburg, scheduled_at: NOW + 10min
    ↓
Edge Function: schedule-felix-runs (Cron)
    ├─ Prüft alle 1 Minute
    └─ Triggert Workflows wenn scheduled_at <= NOW
```

### Zu erstellende/ändernde Dateien

#### 1. Neue Datenbank-Tabelle: `scheduled_felix_runs`

Für die zeitgesteuerte Multi-Stadt-Suche:
- `id` (UUID, PK)
- `project_id` (UUID, FK)
- `user_id` (UUID, FK)
- `city` (TEXT)
- `state` (TEXT)
- `category` (TEXT)
- `max_companies` (INTEGER, optional)
- `scheduled_at` (TIMESTAMPTZ) - Wann soll der Run starten
- `status` (TEXT) - 'pending', 'triggered', 'completed', 'failed'
- `workflow_state_id` (UUID, nullable) - Verknüpfung zum gestarteten Workflow
- `created_at` (TIMESTAMPTZ)

RLS: Nur authentifizierte User mit Project-Zugriff

#### 2. Neue Edge Function: `schedule-felix-runs`

Cron-getriggerte Funktion (jede Minute):
- Sucht nach `scheduled_felix_runs` mit `status = 'pending'` UND `scheduled_at <= NOW`
- Triggert für jeden Eintrag den Felix-Workflow
- Setzt Status auf `'triggered'`

#### 3. Änderung: `src/components/workflows/SingleFinderFelixDialog.tsx`

Komplett überarbeitetes UI:

**Neue State-Variablen:**
```typescript
const [searchMode, setSearchMode] = useState<'state' | 'cities'>('state');
const [selectedCities, setSelectedCities] = useState<Array<{city: string, state: string}>>([]);
```

**UI-Änderungen:**
1. Radio-Gruppe oben: "Bundesland-Suche" vs "Multi-Stadt-Suche"
2. Bei Bundesland-Suche:
   - Dropdown für Bundesland (Pflicht)
   - Stadt-Feld wird ausgeblendet
   - Message: "Bitte finde Unternehmen mit folgenden Kriterien: Bundesland: Bayern, Branche: IT"
3. Bei Multi-Stadt-Suche:
   - Städte-Suche wie bisher, aber mit Multi-Select
   - Badges für ausgewählte Städte (mit X zum Entfernen)
   - Hinweis: "X Städte ausgewählt - Workflows werden im 5-Min-Intervall gestartet"

**Form-Schema erweitern:**
```typescript
const felixSchema = z.discriminatedUnion('searchMode', [
  z.object({
    searchMode: z.literal('state'),
    state: z.string().min(1, 'Bundesland erforderlich'),
    category: z.string().min(1).max(200),
    maxCompanies: z.number().positive().optional(),
  }),
  z.object({
    searchMode: z.literal('cities'),
    cities: z.array(z.object({ city: z.string(), state: z.string() }))
      .min(1, 'Mindestens eine Stadt erforderlich'),
    category: z.string().min(1).max(200),
    maxCompanies: z.number().positive().optional(),
  }),
]);
```

#### 4. Änderung: `src/pages/ProjectDashboard.tsx`

`triggerFelix` Funktion erweitern:
- Bei Bundesland-Suche: Direkt Felix-Workflow mit angepasster Message triggern
- Bei Multi-Stadt-Suche: Scheduled Runs in DB eintragen

```typescript
const triggerFelix = async (config: FelixConfig) => {
  if (config.searchMode === 'state') {
    // Direkt triggern (wie bisher, aber ohne Stadt)
    const message = `Bitte finde Unternehmen: Bundesland: ${config.state}, Branche: ${config.category}`;
    // ... workflow starten
  } else {
    // Multi-Stadt: Scheduled Runs erstellen
    const now = new Date();
    const runs = config.cities.map((cityData, index) => ({
      project_id: id,
      user_id: user.id,
      city: cityData.city,
      state: cityData.state,
      category: config.category,
      max_companies: config.maxCompanies,
      scheduled_at: new Date(now.getTime() + index * 5 * 60 * 1000).toISOString(),
      status: 'pending',
    }));
    
    // In DB speichern
    await supabase.from('scheduled_felix_runs').insert(runs);
    
    // Ersten sofort triggern
    // ... workflow starten
    
    toast.success(`${runs.length} Städte werden durchsucht (5 Min Intervall)`);
  }
};
```

#### 5. Neuer Hook: `src/hooks/useScheduledFelixRuns.ts`

Für die Anzeige geplanter Runs:
```typescript
export const useScheduledFelixRuns = (projectId: string) => {
  return useQuery({
    queryKey: ['scheduled-felix-runs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_felix_runs')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'triggered'])
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};
```

---

### Implementierungsreihenfolge

1. **Datenbank-Migration**
   - Tabelle `scheduled_felix_runs` erstellen
   - RLS-Policies hinzufügen

2. **Edge Function erstellen** (`schedule-felix-runs`)
   - Cron-Setup (jede Minute)
   - Workflow-Trigger-Logik
   - Status-Updates

3. **Dialog überarbeiten** (`SingleFinderFelixDialog.tsx`)
   - Suchodus-Toggle (Bundesland/Multi-Stadt)
   - Multi-Select für Städte
   - Angepasste Validierung

4. **Dashboard anpassen** (`ProjectDashboard.tsx`)
   - `triggerFelix` erweitern für beide Modi
   - Scheduled Runs anlegen

5. **Optional: Anzeige geplanter Runs**
   - Hook erstellen
   - UI-Komponente für ausstehende Suchen

---

### UI-Mockup: Dialog

```text
┌─────────────────────────────────────────────────────────┐
│  Finder Felix starten                              [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Suchmodus:                                             │
│  (•) Bundesland-Suche   ( ) Multi-Stadt-Suche           │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Bundesland *                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Bayern                                       ▼  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Kategorie / Branche *                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ IT-Dienstleister                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Maximale Anzahl Firmen (optional)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 50                                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│                         [Abbrechen]  [Felix starten]    │
└─────────────────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────────────────┐
│  Finder Felix starten                              [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Suchmodus:                                             │
│  ( ) Bundesland-Suche   (•) Multi-Stadt-Suche           │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Städte hinzufügen *                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Stadt suchen...                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Ausgewählte Städte (3):                                │
│  [München, BY ✕] [Nürnberg, BY ✕] [Augsburg, BY ✕]      │
│                                                         │
│  ℹ️ 3 Workflows werden im 5-Minuten-Intervall gestartet  │
│                                                         │
│  Kategorie / Branche *                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ IT-Dienstleister                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Maximale Anzahl Firmen pro Stadt (optional)            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 50                                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│                         [Abbrechen]  [Suchen starten]   │
└─────────────────────────────────────────────────────────┘
```

---

### Technische Details

#### Edge Function Cron-Setup (`supabase/config.toml`)
```toml
[functions.schedule-felix-runs]
verify_jwt = false
schedule = "* * * * *"  # Jede Minute
```

#### Message-Format Bundesland-Suche
```
Bitte finde Unternehmen mit folgenden Kriterien: Bundesland: Bayern, Branche: IT-Dienstleister
```
(Stadt wird weggelassen)

#### Message-Format Multi-Stadt
```
Bitte finde Unternehmen mit folgenden Kriterien: Bundesland: Bayern, Stadt: München, Branche: IT-Dienstleister
```
(Pro Stadt ein separater Workflow)

