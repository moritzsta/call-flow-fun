
## Fix: Multi-Stadt-Suche - Fehlende `message` Variable in n8n

### Problem-Analyse

Die `schedule-felix-runs` Edge Function ruft den n8n Webhook **direkt** auf, anstatt die standardisierte `trigger-n8n-workflow` Edge Function zu verwenden. Dadurch fehlt die wichtige Logik, die die `message` auf Top-Level extrahiert:

```text
Frontend → trigger-n8n-workflow → n8n
           ↓
           Extrahiert message auf Top-Level ✓
           
schedule-felix-runs → n8n (DIREKT)
                      ↓
                      message nur in trigger_data ✗
```

n8n erwartet die `message` auf Top-Level des Request-Body, nicht innerhalb von `trigger_data`.

### Lösung

Die `schedule-felix-runs` Edge Function muss die `message` zusätzlich auf Top-Level des Webhook-Payloads setzen - genau wie es `trigger-n8n-workflow` tut.

### Technische Änderung

**Datei:** `supabase/functions/schedule-felix-runs/index.ts`

**Aktuelle Implementierung (Zeilen 120-125):**
```typescript
const webhookPayload = {
  workflow_id: workflowState.id,
  project_id: run.project_id,
  user_id: run.user_id,
  trigger_data: triggerData,
};
```

**Korrigierte Implementierung:**
```typescript
const webhookPayload = {
  workflow_id: workflowState.id,
  project_id: run.project_id,
  user_id: run.user_id,
  trigger_data: triggerData,
  // KRITISCH: message muss auf Top-Level sein, da n8n es dort erwartet
  message: triggerData.message,
  maxCompanies: triggerData.maxCompanies,
};
```

### Warum dieser Fix funktioniert

1. Die `message` wird jetzt sowohl in `trigger_data` als auch auf Top-Level gesendet
2. n8n kann die `message` auf Top-Level lesen (wie bei normalen Aufrufen)
3. Die Abwärtskompatibilität bleibt erhalten (trigger_data enthält weiterhin alle Daten)

### Implementierungsschritte

1. **Edge Function aktualisieren**
   - `supabase/functions/schedule-felix-runs/index.ts` anpassen
   - `message` und `maxCompanies` auf Top-Level des `webhookPayload` hinzufügen

2. **Deploy und Testen**
   - Edge Function deployen
   - Multi-Stadt-Suche mit 2-3 Städten testen
   - Prüfen, ob alle Workflows korrekt die Message erhalten

### Zusätzliche Logging-Verbesserung (optional)

Für besseres Debugging wird der Payload geloggt:
```typescript
console.log(`[schedule-felix-runs] Webhook payload for run ${run.id}:`, 
  JSON.stringify(webhookPayload, null, 2));
```

### Kein Datenbank-Cache nötig

Der im "Stack Overflow Hint" vorgeschlagene Datenbank-Cache ist **nicht notwendig**, da:
- Die `scheduled_felix_runs` Tabelle bereits alle Daten (city, state, category) speichert
- Die Message wird bei jedem Cron-Aufruf neu aus diesen Daten gebaut
- Das Problem lag nur an der fehlenden Top-Level-Extraktion, nicht am Daten-Verlust

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/functions/schedule-felix-runs/index.ts` | `message` auf Top-Level im Webhook-Payload hinzufügen |
