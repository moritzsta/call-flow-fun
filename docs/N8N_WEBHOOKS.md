# n8n Webhooks Documentation

## Overview

This document describes the n8n workflows integrated with the Cold Calling App and their webhook configurations.

## Workflow Files

The updated n8n workflows are located in `docs/n8n-workflows/`:

- **finder-felix-webhook.json** - Company search workflow
- **analyse-anna-webhook.json** - Company analysis workflow
- **pitch-paul-webhook.json** - Email draft generation workflow
- **email-sender-webhook.json** - Email sending workflow (NEW)

## Environment Variables

The following secrets are configured in Supabase:

- **N8N_WEBHOOK_BASE_URL**: Base URL for n8n webhooks (e.g., `https://your-n8n-instance.com/webhook`)
- **N8N_WEBHOOK_SECRET**: Shared secret for webhook authentication (Header Auth)
- **OPENAI_API_KEY**: OpenAI API key for AI-powered features

## Webhook Security

All webhooks use **Header Auth** with the following configuration:

- **Header Name**: `X-Webhook-Secret`
- **Header Value**: `${N8N_WEBHOOK_SECRET}`

### Edge Function Implementation

When calling n8n webhooks from Edge Functions, include the authentication header:

```typescript
const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/your-workflow-path`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': Deno.env.get('N8N_WEBHOOK_SECRET')!,
  },
  body: JSON.stringify(payload)
});
```

## Active Workflows

### 1. Finder Felix (Company Search)

**Purpose**: Search for companies based on location and industry criteria.

**Webhook Path**: `/finder-felix`

**Input Payload**:
```json
{
  "workflow_id": "uuid",
  "workflow_name": "finder_felix",
  "project_id": "uuid",
  "user_id": "uuid",
  "trigger_data": {
    "user_input": "Finde Bäckereien in München",
    "search_params": {
      "state": "Bayern",
      "city": "München",
      "industry": "Bäckerei"
    }
  }
}
```

**Output** (via Workflow State):
```json
{
  "status": "completed",
  "result_summary": {
    "companies_found": 15
  }
}
```

### 2. Analyse Anna (Company Analysis) - Chat-Enabled ✅

**Purpose**: Analyze company websites through conversational AI and extract key information (CEO, email, business model).

**Webhook Path**: `/analyse-anna`

**Type**: Chat-based workflow with conversational memory

**Input Payload**:
```json
{
  "workflow_id": "uuid",
  "workflow_name": "analyse_anna",
  "project_id": "uuid",
  "user_id": "uuid",
  "message": "Analysiere alle Solartechnik-Firmen in Berlin auf Wärmepumpen-Angebote"
}
```

**Workflow Features**:
- **Conversational Memory**: Maintains context across multiple messages using `workflow_id`
- **Company Search Tools**: Search companies by name, industry, city, district, or state
- **Firecrawl Integration**: Scrapes company websites and extracts structured data
- **Batch Processing**: Analyzes multiple companies in one request
- **Real-time Updates**: Sends progress updates via `workflow_messages` table

**Chat Flow**:
1. User sends analysis request (e.g., "Analysiere Solartechnik-Firmen in Brandenburg")
2. Anna responds with confirmation and asks for analysis goal if needed
3. User clarifies goal (e.g., "Finde CEO und Kontaktdaten")
4. Anna triggers Firecrawl research for all matching companies
5. Results are stored in `companies.analysis` JSONB field
6. Anna sends completion message with count of analyzed companies

**Output** (via Workflow State):
```json
{
  "status": "completed",
  "result_summary": {
    "companies_analysed": 8
  }
}
```

### 3. Pitch Paul (Email Draft Generation) - Chat-Enabled ✅

**Purpose**: Generate personalized sales emails through conversational AI for selected companies.

**Webhook Path**: `/pitch-paul`

**Type**: Chat-based workflow with conversational memory

**Input Payload**:
```json
{
  "workflow_id": "uuid",
  "workflow_name": "pitch_paul",
  "project_id": "uuid",
  "user_id": "uuid",
  "message": "Erstelle Sales-E-Mails für alle analysierten Firmen in Berlin"
}
```

**Workflow Features**:
- **Conversational Memory**: Maintains context using `workflow_id` (Simple Memory node)
- **Company Selection**: User can specify which companies to target
- **Personalization**: Emails are tailored based on company analysis
- **Draft Storage**: Saves emails to `project_emails` table with status `draft`
- **Chat Responses Saved**: All assistant responses are stored in `workflow_messages`

**Chat Flow**:
1. User requests email generation (e.g., "Erstelle Pitch-E-Mails für Solarfirmen")
2. Paul asks for offer/pitch details if needed
3. User provides pitch content
4. Paul confirms company selection and generates emails
5. Emails are stored in `project_emails` table

**Output** (via Workflow State):
```json
{
  "status": "completed",
  "result_summary": {
    "emails_created": 8
  }
}
```

**Important**: This workflow creates email **drafts** only. Use "Sende Susan" to send them.

### 4. Sende Susan (Email Sender) - No Chat ⚡

**Purpose**: Send draft emails via Gmail and update email status to `sent`.

**Webhook Path**: `/sende-susan`

**Type**: Batch processing workflow (no chat interaction)

**Input Payload (Single Email)**:
```json
{
  "workflow_name": "email_sender",
  "workflow_id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "trigger_data": {
    "email_id": "uuid"
  }
}
```

**Input Payload (All Emails)**:
```json
{
  "workflow_name": "email_sender",
  "workflow_id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "trigger_data": {
    "project_id": "uuid",
    "send_all": true
  }
}
```

**Workflow Features**:
- **Gmail Integration**: Uses Gmail OAuth2 to send emails
- **Batch Processing**: Can send multiple emails in one workflow run
- **Status Updates**: Marks emails as `sent` in `project_emails` table
- **Rate Limiting**: Implements delay between emails to avoid Gmail rate limits

**Gmail OAuth Setup**:
1. In n8n, create Gmail OAuth2 credentials
2. Required scopes: `https://www.googleapis.com/auth/gmail.send`
3. Authorize with your sending Gmail account

**Output** (via Workflow State):
```json
{
  "status": "completed",
  "result_summary": {
    "emails_sent": 2,
    "errors": []
  }
}
```

**Important**: 
- Only emails with status `draft` or `ready_to_send` are sent
- Gmail has daily sending limits (500/day for free accounts)
- Emails are sent via Gmail API, not SMTP

## Rate Limiting & Cost Tracking

All AI-powered workflows should implement:

1. **Usage Tracking**: Log token usage per user/organization
2. **Rate Limiting**: Implement cooldown periods based on user plan
3. **Cost Estimation**: Return estimated costs before executing

## Testing

### Test Webhook Connectivity

```bash
curl -X POST https://your-n8n-instance.com/webhook/test \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{"test": true}'
```

### Verify from Edge Function

Create a test edge function:

```typescript
const N8N_WEBHOOK_BASE_URL = Deno.env.get('N8N_WEBHOOK_BASE_URL');
const N8N_WEBHOOK_SECRET = Deno.env.get('N8N_WEBHOOK_SECRET');

const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/test`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': N8N_WEBHOOK_SECRET!,
  },
  body: JSON.stringify({ test: true })
});
```

## Error Handling

Expected HTTP Status Codes:

- **200**: Success
- **401**: Invalid webhook secret
- **429**: Rate limit exceeded
- **500**: Internal n8n error

Edge functions should handle these appropriately:

```typescript
if (!response.ok) {
  if (response.status === 401) {
    throw new Error('Webhook authentication failed');
  }
  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  throw new Error(`Webhook failed: ${response.statusText}`);
}
```

## References

- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Header Auth](https://docs.n8n.io/workflows/credentials/header-auth/)
- Feature Library: `docs/feature-library/04-KI-Integration-Pattern.md`
