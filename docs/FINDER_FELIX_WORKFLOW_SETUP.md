# Finder Felix - Kompletter Chat-fähiger Workflow

## 🎯 Überblick

Dies ist der **vollständig funktionsfähige** Finder Felix Workflow, der:
- ✅ Chat-Interaktion über die Website ermöglicht
- ✅ Rückfragen stellt, wenn Informationen fehlen
- ✅ Automatisch Firmen scraped, sobald alle Infos vorhanden sind
- ✅ Gefundene Firmen in die `companies` Tabelle speichert (mit `project_id`)
- ✅ Chat-Messages in die `workflow_messages` Tabelle schreibt
- ✅ Realtime-Updates an das Frontend sendet

## 📦 Workflow-Import

### 1. Workflow-Datei
**Datei:** `docs/n8n-workflows/finder-felix-complete.json`

### 2. Import in n8n

1. **Öffne n8n Editor**
2. **Gehe zu:** Workflows → Add Workflow → Import from File
3. **Wähle:** `finder-felix-complete.json`
4. **Klicke:** Import

### 3. Credentials konfigurieren

Nach dem Import müssen folgende Credentials konfiguriert werden:

#### a) Supabase API Credential
**Nodes:** `Check_State`, `Check_City`, `Check_District`, `Get State`, `Get City`, `Add Company`, `Update Workflow State`

**Setup:**
- **Name:** "Self-Hosted Supabase"
- **Host:** `https://fttdfvnhghbgtawkslau.supabase.co`
- **Service Role Key:** `[Dein Supabase Service Role Key]`

#### b) OpenAI API Credential
**Node:** `OpenAI Chat Model`

**Setup:**
- **Name:** "OpenAi account"
- **API Key:** `[Dein OpenAI API Key]`

#### c) HTTP Header Auth (Supabase Service Role)
**Nodes:** `Save Response to DB`, `Send Final Message`

**Setup:**
- **Name:** "Supabase Service Role"
- **Name:** `Authorization`
- **Value:** `Bearer [Dein Supabase Service Role Key]`

### 4. Webhook-URL konfigurieren

1. **Aktiviere** den Webhook Trigger Node
2. **Kopiere** die Webhook-URL (z.B. `https://n8n.example.com/webhook/finder-felix`)
3. **Aktualisiere** die `N8N_WEBHOOK_BASE_URL` Secret in Supabase:
   ```
   https://n8n.example.com/webhook
   ```

### 5. Workflow aktivieren

1. **Speichere** den Workflow
2. **Klicke** auf "Active" Toggle (oben rechts)
3. **Status** sollte auf "Active" wechseln

## 🔄 Workflow-Ablauf

### Phase 1: Chat-Interaktion

```
1. User sendet Message über Website
   ↓
2. Frontend triggert n8n Webhook
   ↓
3. Webhook empfängt: workflow_id, project_id, user_id, message
   ↓
4. Parse Webhook Input extrahiert Daten
   ↓
5. Finder Felix AI Agent verarbeitet Message mit Memory
   ↓
6. Save Response to DB schreibt Antwort in workflow_messages
   ↓
7. Frontend empfängt Antwort via Realtime
```

### Phase 2: Scraping (wenn startScraping = true)

```
1. Start Scraping IF-Node prüft Conditions
   ↓
2. Switch Node wählt Location Type (State/City/District)
   ↓
3. Loop Over Items iteriert über Locations
   ↓
4. Build URL erstellt Gelbe Seiten URLs
   ↓
5. Search Request holt HTML
   ↓
6. Extract Company Cards extrahiert Firmen-Liste
   ↓
7. Extract Detail Pages holt Detail-URLs
   ↓
8. Split Out Detail Pages splittet in einzelne Items
   ↓
9. Detail Request holt Firmen-Details
   ↓
10. Extract Info Section extrahiert Kontakt-HTML
   ↓
11. Extract Contact Info parsed Firmen-Daten
   ↓
12. Remove Duplicates entfernt Duplikate
   ↓
13. Add Company speichert in companies Tabelle (mit project_id!)
   ↓
14. Loop Over Items wiederholt für nächste Location
```

### Phase 3: Abschluss

```
1. Count Companies zählt gefundene Firmen
   ↓
2. Send Final Message schreibt "Fertig!"-Nachricht
   ↓
3. Update Workflow State setzt status="completed", conversation_active=false
```

## 🔧 Wichtige Nodes

### 1. Parse Webhook Input
**Zweck:** Extrahiert `workflow_id`, `project_id`, `user_id`, `message`

**Code:**
```javascript
const body = $input.item.json.body;

return {
  workflow_id: body.workflow_id,
  project_id: body.project_id,
  user_id: body.user_id,
  message: {
    text: body.message || body.trigger_data?.user_input || ''
  }
};
```

### 2. Simple Memory
**Zweck:** Session-basierte Conversation Memory

**Session Key:** `={{ $('Parse Webhook Input').item.json.workflow_id }}`

**Wichtig:** Nutzt `workflow_id` statt Telegram Chat ID!

### 3. Finder Felix AI Agent
**Zweck:** Interaktiver KI-Agent, der Rückfragen stellt

**System Prompt:**
- Spricht User als "Boss" oder "Chef" an
- Stellt kurze Rückfragen, wenn Info fehlt
- Setzt `startScraping = true` nur, wenn alles klar ist

**Output Format:**
```json
{
  "finderFelixAnswer": "Solartechnik in Berlin - läuft, Boss!",
  "industry": "Solartechnik",
  "city": "Berlin",
  "state": "",
  "district": "",
  "locationType": "city",
  "startScraping": true
}
```

### 4. Save Response to DB
**Zweck:** Schreibt AI-Antwort in `workflow_messages`

**HTTP Request zu:** `https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/save-workflow-message`

**Body:**
```json
{
  "workflow_state_id": "{{ workflow_id }}",
  "project_id": "{{ project_id }}",
  "role": "assistant",
  "content": "{{ finderFelixAnswer }}",
  "metadata": {
    "industry": "{{ industry }}",
    "city": "{{ city }}",
    "startScraping": "{{ startScraping }}"
  }
}
```

### 5. Start Scraping IF-Node
**Zweck:** Prüft, ob Scraping gestartet werden soll

**Conditions:**
- `industry` is not empty
- `locationType` is not empty
- `startScraping` is true

**Wichtig:** Wenn FALSE → Workflow endet, wartet auf nächste User-Message!

### 6. Add Company
**Zweck:** Speichert gefundene Firma in `companies` Tabelle

**Wichtig:** Nutzt `project_id` aus Parse Webhook Input!

**Fields:**
- `project_id`: `={{ $('Parse Webhook Input').item.json.project_id }}`
- `company`: `={{ $json.contactInfo.companyName }}`
- `industry`: `={{ $('Finder Felix').item.json.output.industry }}`
- `phone`: `={{ $json.contactInfo.phoneNumber }}`
- `website`: `={{ $json.contactInfo.website }}`
- `address`: `={{ $json.contactInfo.fullAddress }}`
- `state`: `={{ $('Loop Over Items').item.json.state }}`
- `city`: `={{ $('Loop Over Items').item.json.city }}`
- `district`: `={{ $('Loop Over Items').item.json.district }}`
- `status`: `found`

### 7. Send Final Message
**Zweck:** Sendet "Fertig!"-Nachricht an Frontend

**Content:** `Fertig, Boss! {{ companiesFound }} Firmen gefunden! 🎉`

### 8. Update Workflow State
**Zweck:** Markiert Workflow als abgeschlossen

**Updates:**
- `status`: "completed"
- `completed_at`: current timestamp
- `conversation_active`: false
- `result_summary`: `{ companies_found: X }`

## ✅ Testing-Checklist

### Backend
- [ ] Edge Function `save-workflow-message` deployed
- [ ] `workflow_messages` Tabelle existiert
- [ ] `n8n_workflow_states` hat `conversation_active` Spalte
- [ ] RLS Policies sind aktiv
- [ ] Realtime ist aktiviert für `workflow_messages`

### n8n Workflow
- [ ] Workflow importiert
- [ ] Alle Credentials konfiguriert
- [ ] Webhook ist aktiv
- [ ] Webhook-URL ist erreichbar

### Frontend
- [ ] `/projects/:id/finder-felix` Page existiert
- [ ] `<ChatInterface />` Component funktioniert
- [ ] `useWorkflowChat` Hook lädt Messages
- [ ] Realtime-Updates funktionieren

### End-to-End Test

1. **Chat starten:**
   - User: "Solartechnik"
   - Felix: "Wo soll ich suchen, Boss?"

2. **Rückfrage beantworten:**
   - User: "Berlin"
   - Felix: "Solartechnik in Berlin - läuft, Boss!"

3. **Scraping beobachten:**
   - Scraping startet automatisch
   - Companies erscheinen live in der Tabelle
   - Felix sendet: "Fertig, Boss! X Firmen gefunden! 🎉"

4. **Status prüfen:**
   - Workflow State zeigt "completed"
   - `conversation_active` ist false

## 🐛 Troubleshooting

### Problem: Felix antwortet nicht
**Lösung:**
1. Prüfe n8n Workflow Execution Log
2. Prüfe Edge Function Logs: `supabase functions logs save-workflow-message`
3. Prüfe Browser Console für Realtime-Subscription-Fehler

### Problem: Scraping startet nicht
**Lösung:**
1. Prüfe, ob `startScraping = true` im Agent-Output
2. Prüfe "Start Scraping" IF-Node Conditions
3. Prüfe, ob `industry` und `locationType` gesetzt sind

### Problem: Companies werden nicht gespeichert
**Lösung:**
1. Prüfe "Add Company" Node Execution
2. Prüfe Supabase RLS Policies für `companies` Tabelle
3. Prüfe, ob `project_id` korrekt übergeben wird

### Problem: Frontend empfängt keine Messages
**Lösung:**
1. Prüfe Realtime-Subscription: `workflow-messages:{workflow_state_id}`
2. Prüfe, ob `workflow_state_id` korrekt ist
3. Prüfe Browser Console für Subscription-Errors

## 📚 Weitere Dokumentation

- **Frontend Setup:** `docs/BUILD_PROMPTS.md`
- **API Reference:** `docs/API_REFERENCE.md`
- **Edge Functions:** `supabase/functions/save-workflow-message/index.ts`
- **Webhook Migration:** `docs/N8N_WEBHOOK_MIGRATION.md`

## 🚀 Nächste Schritte

1. **Importiere** den Workflow in n8n
2. **Konfiguriere** alle Credentials
3. **Aktiviere** den Workflow
4. **Teste** die Chat-Integration über das Frontend
5. **Optional:** Repliziere für Analyse Anna und Pitch Paul
