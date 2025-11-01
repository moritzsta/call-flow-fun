# n8n Webhook Migration Guide

## Übersicht

Diese Anleitung zeigt, wie die 3 bestehenden Telegram-basierten n8n-Workflows (`Analyse Anna`, `Finder Felix`, `Pitch Paul`) auf Webhook-Trigger umgebaut werden.

**Wichtig:** Es werden NUR minimale Änderungen vorgenommen - die komplette bestehende Funktionalität bleibt erhalten!

---

## 🔧 Vorbereitung

1. **n8n öffnen** (Version 1.116.2)
2. **Secrets prüfen**:
   - `N8N_WEBHOOK_SECRET` in n8n Environment Variables muss gesetzt sein
   - Dieses Secret wird für die Header-Auth der Webhooks verwendet

3. **Backup erstellen**:
   - Exportiere alle 3 Workflows als JSON
   - Speichere sie lokal ab (Fallback)

---

## 📋 Workflow 1: Analyse Anna

### Schritt 1: Telegram-Trigger entfernen

1. Öffne Workflow "Analyse-Anna [Datenanalystin]"
2. **Lösche diese Nodes**:
   - `Message Anna` (Telegram Trigger)
   - `Answer User` (Telegram Send Message)

### Schritt 2: Webhook-Trigger hinzufügen

1. Ziehe einen **Webhook Trigger Node** auf die Canvas
2. Konfiguration:
   ```
   HTTP Method: POST
   Path: analyse-anna
   Authentication: Header Auth
   Header Name: X-Webhook-Secret
   Header Value: {{ $credentials.headerAuth.secret }}
   ```
3. **Position:** Links oben (ersetze die Position von "Message Anna")

### Schritt 3: Parse Webhook Input Node hinzufügen

1. Ziehe einen **Code Node** auf die Canvas
2. Name: `Parse Webhook Input`
3. Code:
   ```javascript
   const body = $input.item.json.body;

   return {
     workflow_id: body.workflow_id,
     project_id: body.project_id,
     user_id: body.user_id,
     message: {
       text: body.trigger_data?.user_input || ''
     }
   };
   ```
4. **Verbinde:** `Webhook Trigger` → `Parse Webhook Input`

### Schritt 4: ENV Node anpassen

1. Finde den Node `ENV`
2. Ändere das Assignment:
   ```javascript
   // Alt:
   supabaseProjectID: "nythxjdfrrtdvlhxndjg"
   
   // Neu:
   supabaseProjectID: $('Parse Webhook Input').item.json.project_id
   ```

### Schritt 5: Simple Memory Node anpassen

1. Finde den Node `Simple Memory`
2. Ändere die Session Key:
   ```javascript
   // Alt:
   sessionKey: $('Message Anna').item.json.message.chat.id
   
   // Neu:
   sessionKey: $('Parse Webhook Input').item.json.user_id
   ```

### Schritt 6: Analyse Anna Agent Node anpassen

1. Finde den Node `Analyse Anna`
2. Ändere den `text` Parameter:
   ```javascript
   // Alt:
   text: $json.message.text
   
   // Neu:
   text: $('Parse Webhook Input').item.json.message.text
   ```

### Schritt 7: Update Workflow State Node hinzufügen

1. Ziehe einen **Supabase Node** auf die Canvas (am Ende des Workflows)
2. Name: `Update Workflow State`
3. Konfiguration:
   ```
   Operation: Update
   Table: n8n_workflow_states
   Match By: id
   Match Value: {{ $('Parse Webhook Input').item.json.workflow_id }}
   
   Fields:
     - status: "completed"
     - completed_at: {{ $now.toISO() }}
     - result_summary: {{ { analysis_completed: true } }}
   ```

### Schritt 8: Verbindungen anpassen

1. **Hauptkette:**
   ```
   Webhook Trigger 
   → Parse Webhook Input 
   → ENV 
   → Analyse Anna 
   → Start Analysing
   → [restlicher Workflow bleibt unverändert]
   → Update Workflow State
   ```

---

## 📋 Workflow 2: Finder Felix

### Schritt 1: Telegram-Trigger entfernen

1. Öffne Workflow "Finder-Felix [Praktikant]"
2. **Lösche diese Nodes**:
   - `Message Felix` (Telegram Trigger)
   - `Answer User` (Telegram Send Message)

### Schritt 2: Webhook-Trigger hinzufügen

1. Ziehe einen **Webhook Trigger Node** auf die Canvas
2. Konfiguration:
   ```
   HTTP Method: POST
   Path: finder-felix
   Authentication: Header Auth
   Header Name: X-Webhook-Secret
   Header Value: {{ $credentials.headerAuth.secret }}
   ```

### Schritt 3: Parse Webhook Input Node hinzufügen

1. Ziehe einen **Code Node** auf die Canvas
2. Name: `Parse Webhook Input`
3. Code:
   ```javascript
   const body = $input.item.json.body;

   return {
     workflow_id: body.workflow_id,
     project_id: body.project_id,
     user_id: body.user_id,
     message: {
       text: body.trigger_data?.user_input || ''
     }
   };
   ```

### Schritt 4: Simple Memory Node anpassen

1. Finde den Node `Simple Memory`
2. Ändere die Session Key:
   ```javascript
   // Alt:
   sessionKey: $json.message.chat.id
   
   // Neu:
   sessionKey: $('Parse Webhook Input').item.json.user_id
   ```

### Schritt 5: Finder Felix Agent Node anpassen

1. Finde den Node `Finder Felix`
2. Ändere den `text` Parameter:
   ```javascript
   // Alt:
   text: $json.message.text
   
   // Neu:
   text: $('Parse Webhook Input').item.json.message.text
   ```

### Schritt 6: Add Company Node erweitern

1. Finde den Node `Add Company`
2. **Füge ein neues Field hinzu**:
   ```
   Field: project_id
   Value: {{ $('Parse Webhook Input').item.json.project_id }}
   ```

### Schritt 7: Completion Message Node hinzufügen

1. Ziehe einen **Telegram Node** auf die Canvas (am Ende)
2. Name: `Completion Message`
3. Konfiguration:
   ```
   Chat ID: {{ $('Parse Webhook Input').item.json.user_id }}
   Text: "Firmensuche abgeschlossen! {{ $items('Add Company').length }} Firmen gefunden."
   ```

### Schritt 8: Update Workflow State Node hinzufügen

1. Ziehe einen **Supabase Node** auf die Canvas
2. Name: `Update Workflow State`
3. Konfiguration:
   ```
   Operation: Update
   Table: n8n_workflow_states
   Match By: id
   Match Value: {{ $('Parse Webhook Input').item.json.workflow_id }}
   
   Fields:
     - status: "completed"
     - completed_at: {{ $now.toISO() }}
     - result_summary: {{ { companies_found: $items('Add Company').length } }}
   ```

---

## 📋 Workflow 3: Pitch Paul

### Schritt 1: Telegram-Trigger entfernen

1. Öffne Workflow "Pitch-Paul [Vertriebler]"
2. **Lösche diese Nodes**:
   - `Message Paul` (Telegram Trigger)
   - `Answer User` (Telegram Send Message)

### Schritt 2: Webhook-Trigger hinzufügen

1. Ziehe einen **Webhook Trigger Node** auf die Canvas
2. Konfiguration:
   ```
   HTTP Method: POST
   Path: pitch-paul
   Authentication: Header Auth
   Header Name: X-Webhook-Secret
   Header Value: {{ $credentials.headerAuth.secret }}
   ```

### Schritt 3: Parse Webhook Input Node hinzufügen

1. Ziehe einen **Code Node** auf die Canvas
2. Name: `Parse Webhook Input`
3. Code:
   ```javascript
   const body = $input.item.json.body;

   return {
     workflow_id: body.workflow_id,
     project_id: body.project_id,
     user_id: body.user_id,
     message: {
       text: body.trigger_data?.user_input || ''
     }
   };
   ```

### Schritt 4: Pitch-Paul Agent Node anpassen

1. Finde den Node `Pitch-Paul`
2. Ändere den `text` Parameter:
   ```javascript
   // Alt:
   text: $json.message.text
   
   // Neu:
   text: $('Parse Webhook Input').item.json.message.text
   ```

### Schritt 5: Gmail Node durch Supabase Insert ersetzen

**WICHTIG:** E-Mails sollen NICHT direkt versendet werden!

1. **Lösche den Node:** `Gmail` (Draft erstellen)

2. **Füge einen Supabase Node hinzu:**
   - Name: `Save Email Draft`
   - Operation: `Insert`
   - Table: `project_emails`
   - Fields:
     ```
     company_id: {{ $('Get General Info').item.json.id }}
     project_id: {{ $('Parse Webhook Input').item.json.project_id }}
     recipient_email: {{ $json['emails[0]'] }}
     subject: {{ $('Write Email').item.json.message.content.subject }}
     body: {{ $('Write Email').item.json.message.content.emailText }}
     status: "draft"
     ```

### Schritt 6: Completion Message Node hinzufügen

1. Ziehe einen **Telegram Node** auf die Canvas
2. Name: `Completion Message`
3. Konfiguration:
   ```
   Chat ID: {{ $('Parse Webhook Input').item.json.user_id }}
   Text: "E-Mail-Entwürfe erstellt! {{ $items('Save Email Draft').length }} E-Mails vorbereitet."
   ```

### Schritt 7: Update Workflow State Node hinzufügen

1. Ziehe einen **Supabase Node** auf die Canvas
2. Name: `Update Workflow State`
3. Konfiguration:
   ```
   Operation: Update
   Table: n8n_workflow_states
   Match By: id
   Match Value: {{ $('Parse Webhook Input').item.json.workflow_id }}
   
   Fields:
     - status: "completed"
     - completed_at: {{ $now.toISO() }}
     - result_summary: {{ { emails_drafted: $items('Save Email Draft').length } }}
   ```

---

## 📋 Workflow 4 (NEU): Email Sender

Dieser Workflow ist komplett NEU und muss erstellt werden.

### Schritt 1: Neuen Workflow erstellen

1. Klicke auf "New Workflow"
2. Name: `Email-Sender [Webhook]`

### Schritt 2: Webhook Trigger

1. Ziehe einen **Webhook Trigger Node** auf die Canvas
2. Konfiguration:
   ```
   HTTP Method: POST
   Path: email-sender
   Authentication: Header Auth
   Header Name: X-Webhook-Secret
   Header Value: {{ $credentials.headerAuth.secret }}
   ```

### Schritt 3: Parse Webhook Input

1. Code Node: `Parse Webhook Input`
2. Code:
   ```javascript
   const body = $input.item.json.body;

   return {
     workflow_id: body.workflow_id,
     project_id: body.project_id,
     user_id: body.user_id,
     email_ids: body.trigger_data?.email_ids || [],
     send_mode: body.trigger_data?.send_mode || 'single'
   };
   ```

### Schritt 4: Split Email IDs

1. Code Node: `Split Email IDs`
2. Code:
   ```javascript
   const emailIds = $input.item.json.email_ids;
   const projectId = $input.item.json.project_id;

   if (!emailIds || emailIds.length === 0) {
     throw new Error('No email IDs provided');
   }

   return emailIds.map(id => ({
     json: {
       email_id: id,
       project_id: projectId
     }
   }));
   ```

### Schritt 5: Get Email

1. Supabase Node: `Get Email`
2. Konfiguration:
   ```
   Operation: Get
   Table: project_emails
   Filters:
     - id = {{ $json.email_id }}
     - project_id = {{ $json.project_id }}
     - status = "draft"
   ```

### Schritt 6: Send via Gmail

1. Gmail Node: `Send via Gmail`
2. Konfiguration:
   ```
   Resource: Message
   Operation: Send
   To: {{ $json.recipient_email }}
   Subject: {{ $json.subject }}
   Message Type: HTML
   Message: {{ $json.body }}
   ```

### Schritt 7: Mark as Sent

1. Supabase Node: `Mark as Sent`
2. Konfiguration:
   ```
   Operation: Update
   Table: project_emails
   Match By: id
   Match Value: {{ $('Get Email').item.json.id }}
   
   Fields:
     - status: "sent"
     - sent_at: {{ $now.toISO() }}
   ```

### Schritt 8: Update Company Status

1. Supabase Node: `Update Company Status`
2. Konfiguration:
   ```
   Operation: Update
   Table: companies
   Match By: id
   Match Value: {{ $('Get Email').item.json.company_id }}
   
   Fields:
     - status: "contacted"
   ```

### Schritt 9: Update Workflow State

1. Supabase Node: `Update Workflow State`
2. Konfiguration:
   ```
   Operation: Update
   Table: n8n_workflow_states
   Match By: id
   Match Value: {{ $('Parse Webhook Input').item.json.workflow_id }}
   
   Fields:
     - status: "completed"
     - completed_at: {{ $now.toISO() }}
     - result_summary: {{ { emails_sent: $items('Mark as Sent').length } }}
   ```

### Workflow-Verbindungen:

```
Webhook Trigger 
→ Parse Webhook Input 
→ Split Email IDs 
→ Get Email 
→ Send via Gmail 
→ Mark as Sent 
→ Update Company Status 
→ Update Workflow State
```

---

## ✅ Testing

Nach jeder Workflow-Anpassung:

1. **Workflow aktivieren**
2. **Webhook-URL kopieren** (aus dem Webhook-Trigger Node)
3. **Test-Request senden:**
   ```bash
   curl -X POST https://n8n.your-domain.com/webhook/analyse-anna \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Secret: your-secret" \
     -d '{
       "workflow_id": "test-123",
       "project_id": "your-project-id",
       "user_id": "your-user-id",
       "trigger_data": {
         "user_input": "Analysiere BMW"
       }
     }'
   ```

---

## 🔑 Wichtige Hinweise

1. **Alle Supabase-Credentials** müssen in n8n korrekt hinterlegt sein
2. **OpenAI/OpenRouter API Keys** müssen gesetzt sein
3. **Gmail OAuth** muss für den Email-Sender konfiguriert sein
4. **Firecrawl API Key** muss für Analyse Anna gesetzt sein
5. **Header Auth Credential** muss in n8n erstellt werden mit dem Webhook-Secret

---

## 📊 Übersicht der Änderungen

| Workflow | Telegram Trigger | Webhook Trigger | Parse Node | Workflow State Update |
|----------|------------------|-----------------|------------|---------------------|
| Analyse Anna | ❌ Entfernt | ✅ Hinzugefügt | ✅ Hinzugefügt | ✅ Hinzugefügt |
| Finder Felix | ❌ Entfernt | ✅ Hinzugefügt | ✅ Hinzugefügt | ✅ Hinzugefügt |
| Pitch Paul | ❌ Entfernt | ✅ Hinzugefügt | ✅ Hinzugefügt | ✅ Hinzugefügt |
| Email Sender | - | ✅ Neu erstellt | ✅ Hinzugefügt | ✅ Hinzugefügt |

---

## 🎯 Nächste Schritte

Nachdem alle Workflows umgebaut sind:

1. **Frontend-Integration testen** (über die Website)
2. **Realtime-Updates** in der UI verifizieren
3. **Error-Handling** testen (falsche Inputs, fehlende Daten)
4. **Performance** bei vielen gleichzeitigen Requests prüfen

---

Viel Erfolg beim Umbau! 🚀
