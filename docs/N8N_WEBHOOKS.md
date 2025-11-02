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

### 3. Pitch Paul (Email Draft Generation)

**Purpose**: Generate personalized sales emails for analyzed companies.

**Webhook Path**: `/pitch-paul`

**Input Payload**:
```json
{
  "workflow_id": "uuid",
  "workflow_name": "pitch_paul",
  "project_id": "uuid",
  "user_id": "uuid",
  "trigger_data": {
    "user_input": "Erstelle Sales-E-Mails für alle analysierten Firmen",
    "offer": "Wir bieten professionelle SEO-Optimierung...",
    "target_companies": []
  }
}
```

**Output** (via Workflow State):
```json
{
  "status": "completed",
  "result_summary": {
    "emails_created": 8
  }
}
```

**Important**: This workflow creates email **drafts** in the `project_emails` table. It does NOT send emails directly.

### 4. Email Sender (NEW)

**Purpose**: Send draft emails via Gmail and update status.

**Webhook Path**: `/email-sender`

**Input Payload**:
```json
{
  "workflow_id": "uuid",
  "workflow_name": "email_sender",
  "project_id": "uuid",
  "user_id": "uuid",
  "trigger_data": {
    "email_ids": ["uuid1", "uuid2"],
    "send_mode": "batch"
  }
}
```

**Output** (via Workflow State):
```json
{
  "status": "completed",
  "result_summary": {
    "emails_sent": 2
  }
}
```

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
