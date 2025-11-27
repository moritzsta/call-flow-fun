# n8n Workflow Setup: Advance Pipeline Integration

## Übersicht

Jeder Auto-Workflow (Finder Felix, Analyse Anna, Pitch Paul, Branding Britta) muss am Ende die Edge Function `advance-pipeline` aufrufen, damit der nächste Workflow automatisch gestartet wird.

## HTTP Request Node Konfiguration

Am **Ende jedes Workflows** einen **HTTP Request Node** hinzufügen:

### Node Settings

**Method:** `POST`

**URL:** 
```
https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/advance-pipeline
```

### Headers

Füge folgende Header hinzu:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

### Body (JSON)

```json
{
  "workflow_id": "{{ $('Webhook').item.json.workflow_id }}",
  "workflow_name": "finder_felix",
  "status": "completed"
}
```

**Wichtig:** Ersetze `workflow_name` mit dem Namen des jeweiligen Workflows:

| Workflow | workflow_name Wert |
|----------|-------------------|
| Finder Felix | `finder_felix` |
| Analyse Anna (Auto) | `analyse_anna_auto` |
| Pitch Paul (Auto) | `pitch_paul_auto` |
| Branding Britta (Auto) | `branding_britta_auto` |

### Beispiel für Finder Felix

```json
{
  "workflow_id": "{{ $('Webhook').item.json.workflow_id }}",
  "workflow_name": "finder_felix",
  "status": "completed"
}
```

### Beispiel für Analyse Anna

```json
{
  "workflow_id": "{{ $('Webhook').item.json.workflow_id }}",
  "workflow_name": "analyse_anna_auto",
  "status": "completed"
}
```

## Workflow-Reihenfolge

Die Pipeline durchläuft folgende Phasen:

1. **Finder Felix** (`finder_felix`)
   → ruft `advance-pipeline` auf
   → startet **Analyse Anna**

2. **Analyse Anna** (`analyse_anna_auto`)
   → ruft `advance-pipeline` auf
   → startet **Pitch Paul**

3. **Pitch Paul** (`pitch_paul_auto`)
   → ruft `advance-pipeline` auf
   → startet **Branding Britta**

4. **Branding Britta** (`branding_britta_auto`)
   → ruft `advance-pipeline` auf
   → Pipeline: **completed**

## Node-Position

Platziere den HTTP Request Node:
- **Nach** dem letzten Datenbank-Update
- **Vor** dem abschließenden Response-Node (falls vorhanden)
- Als **letzten Schritt** im Workflow

## Error Handling

Falls der HTTP-Call fehlschlägt:
- Der aktuelle Workflow ist bereits abgeschlossen
- Die Pipeline wird nicht fortgesetzt
- **Recovery**: Nutze die manuelle Recovery-Funktion (siehe unten)

## Manuelle Recovery

Falls eine Pipeline stecken bleibt (z.B. Anna läuft 2 Stunden ohne zu beenden):

### Recovery API Call

```bash
POST https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/advance-pipeline
Content-Type: application/json

{
  "recover": true,
  "pipeline_id": "xxx-xxx-xxx"
}
```

**Was passiert:**
1. Der stuck Workflow wird als `failed` markiert
2. Der **nächste** Workflow in der Reihenfolge wird gestartet
3. Die Pipeline läuft weiter

### Beispiel

Anna ist stuck → Recovery aufrufen → Anna wird `failed` → Paul wird gestartet

## Debugging

### Edge Function Logs

Logs der `advance-pipeline` Function:
https://supabase.com/dashboard/project/fttdfvnhghbgtawkslau/functions/advance-pipeline/logs

### Was wird geloggt?

- Empfangene Workflow-Daten
- Gefundene Pipeline-ID
- Nächster Workflow
- Trigger-Status
- Fehler

### Typische Log-Einträge

```
advance-pipeline called with: { workflow_id: "xxx", workflow_name: "finder_felix", status: "completed" }
Found pipeline: yyy current_phase: finder_felix
Current workflow: finder_felix Next workflow: analyse_anna_auto
Updated pipeline phase to: analyse_anna_auto
Waiting 30 seconds before triggering next workflow...
Created new workflow state: zzz
Triggering next workflow: analyse_anna_auto
Successfully triggered next workflow: analyse_anna_auto
```

## Testing

### Test einzelnen Workflow-Call

```bash
curl -X POST https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/advance-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "test-workflow-id",
    "workflow_name": "finder_felix",
    "status": "completed"
  }'
```

### Erwartete Response

```json
{
  "message": "Next workflow triggered",
  "next_workflow": "analyse_anna_auto",
  "workflow_id": "new-workflow-id",
  "pipeline_id": "pipeline-id"
}
```

## Checklist für jeden Workflow

- [ ] HTTP Request Node am Ende des Workflows hinzugefügt
- [ ] URL korrekt: `https://fttdfvnhghbgtawkslau.supabase.co/functions/v1/advance-pipeline`
- [ ] Method: `POST`
- [ ] Header: `Content-Type: application/json`
- [ ] Body enthält: `workflow_id`, `workflow_name`, `status`
- [ ] `workflow_name` ist korrekt für diesen Workflow
- [ ] Node ist **nach** allen Datenbank-Updates platziert
- [ ] Workflow getestet

## Vorteile dieser Architektur

✅ **Browser-unabhängig** - Pipeline läuft weiter auch wenn Browser geschlossen  
✅ **Robuster** - n8n steuert die Pipeline selbst  
✅ **Einfacher zu debuggen** - Alle Logs in der Edge Function  
✅ **Recoverable** - Stuck Pipelines können fortgesetzt werden  
✅ **Skalierbar** - Keine Frontend-Abhängigkeiten
