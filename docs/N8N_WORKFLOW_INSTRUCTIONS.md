# n8n Workflow Anpassungen für Chat-Integration

## Finder Felix Workflow - Erforderliche Änderungen

Der Workflow wurde vorbereitet für die Chat-Integration. Folgende manuelle Anpassungen sind im n8n Editor vorzunehmen:

### 1. Neuer Node: "Save Response to DB" (nach "Finder Felix" Agent)

**Node-Typ:** HTTP Request  
**Position:** Zwischen "Finder Felix" Agent und "Start Scraping" If-Node  
**URL:** `https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/save-workflow-message`  
**Method:** POST  
**Authentication:** None (public Edge Function)

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "workflow_state_id": "={{ $('Parse Webhook Input').item.json.workflow_id }}",
  "project_id": "={{ $('Parse Webhook Input').item.json.project_id }}",
  "role": "assistant",
  "content": "={{ $('Finder Felix').item.json.output.finderFelixAnswer }}",
  "metadata": {
    "industry": "={{ $('Finder Felix').item.json.output.industry }}",
    "city": "={{ $('Finder Felix').item.json.output.city }}",
    "state": "={{ $('Finder Felix').item.json.output.state }}",
    "district": "={{ $('Finder Felix').item.json.output.district }}",
    "startScraping": "={{ $('Finder Felix').item.json.output.startScraping }}"
  }
}
```

**Error Handling:** "Continue On Fail"

### 2. Node "Parse Webhook Input" - Bereits angepasst ✅

Der Code wurde bereits aktualisiert, um sowohl `message` als auch `trigger_data.user_input` zu unterstützen:

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

### 3. Memory Node - Bereits angepasst ✅

Der Session Key nutzt jetzt `workflow_id` statt `user_id`:

```
={{ $('Parse Webhook Input').item.json.workflow_id }}
```

### 4. System Prompt - Bereits angepasst ✅

Der interaktive System-Prompt wurde wiederhergestellt:
- Felix spricht den User als "Boss" oder "Chef" an
- Stellt Rückfragen, wenn Informationen fehlen
- Setzt `startScraping = true` nur, wenn alles klar ist

### 5. Workflow-Ablauf

```
Webhook Trigger
    ↓
Parse Webhook Input (extrahiert workflow_id, project_id, message)
    ↓
Finder Felix Agent (verarbeitet Message mit Memory)
    ↓
Save Response to DB (speichert Antwort in workflow_messages) ← NEU!
    ↓
Start Scraping? (If-Node)
    ↓ (TRUE)
Build Search URLs → Loop Over Items → Search Request → Extract Companies → Add to DB
    ↓ (FALSE)
Ende (wartet auf nächste User-Message)
```

### 6. Final Message Node (optional, am Ende des Scraping-Flows)

Wenn Scraping abgeschlossen ist, sollte eine finale Nachricht gesendet werden:

**Node-Typ:** HTTP Request  
**URL:** `https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/save-workflow-message`  
**Method:** POST

**Body:**
```json
{
  "workflow_state_id": "={{ $('Parse Webhook Input').item.json.workflow_id }}",
  "project_id": "={{ $('Parse Webhook Input').item.json.project_id }}",
  "role": "assistant",
  "content": "Fertig, Boss! {{ $('Loop Over Items').item.json.companiesFound || 0 }} Firmen gefunden! 🎉",
  "metadata": {
    "completed": true
  }
}
```

### 7. Workflow State Update (optional)

Am Ende des Scraping-Flows:

**Node-Typ:** Supabase Node  
**Operation:** Update  
**Table:** n8n_workflow_states  
**Filter:** `id = {{ $('Parse Webhook Input').item.json.workflow_id }}`

**Fields to Update:**
- `status`: "completed"
- `conversation_active`: false
- `completed_at`: `{{ $now }}`

## Testing-Checklist

1. ✅ Webhook empfängt `workflow_id`, `project_id`, `message`
2. ✅ Parse Webhook Input extrahiert korrekt
3. ✅ Memory funktioniert (Felix erinnert sich an vorherige Messages)
4. ✅ Felix stellt Rückfragen, wenn Info fehlt
5. ⚠️ Felix' Antwort wird in DB gespeichert (neuer Node!)
6. ✅ Frontend empfängt Antwort via Realtime
7. ✅ Wenn `startScraping = true`: Scraping startet
8. ⚠️ Nach Scraping: Final Message wird gesendet
9. ⚠️ Workflow State wird auf "completed" gesetzt

## Nächste Schritte

1. Öffne den Finder Felix Workflow in n8n
2. Füge den "Save Response to DB" Node nach dem "Finder Felix" Agent ein
3. Verbinde ihn mit dem "Start Scraping?" If-Node
4. (Optional) Füge Final Message Node am Ende des Scraping-Flows hinzu
5. (Optional) Füge Workflow State Update Node hinzu
6. Speichere und teste den Workflow

## Troubleshooting

**Problem:** Frontend empfängt keine Antworten  
**Lösung:** Prüfe, ob der "Save Response to DB" Node korrekt konfiguriert ist und die Edge Function erreicht

**Problem:** Memory funktioniert nicht  
**Lösung:** Prüfe, ob der Session Key auf `workflow_id` gesetzt ist

**Problem:** Workflow startet nicht  
**Lösung:** Prüfe die Webhook-Authentifizierung (N8N_WEBHOOK_SECRET Header)

## Analyse Anna & Pitch Paul

Dieselben Änderungen müssen auch für die anderen beiden Workflows vorgenommen werden:
- Analyse Anna: Analoger "Save Response" Node
- Pitch Paul: Analoger "Save Response" Node
- Jeweils angepasster System-Prompt (interaktiv mit Rückfragen)
