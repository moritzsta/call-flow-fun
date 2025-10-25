# n8n Webhooks Documentation

## Overview

This document describes the n8n workflows integrated with the Cold Calling App and their webhook configurations.

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

## Planned Workflows

### 1. Smart Upload (OCR + Metadata Extraction)

**Purpose**: Extract metadata from uploaded documents using OCR and AI.

**Webhook Path**: `/smart-upload`

**Input Payload**:
```json
{
  "file_url": "https://storage.supabase.co/...",
  "user_id": "uuid",
  "mime_type": "application/pdf"
}
```

**Output**:
```json
{
  "title": "Extracted title",
  "metadata": {
    "category": "contracts",
    "tags": ["sales", "legal"]
  },
  "suggested_path": "contracts/2025/client-name"
}
```

### 2. Smart Improve (Prompt Enhancement)

**Purpose**: Enhance user prompts with contextual questions and improvements.

**Webhook Paths**:
- `/smart-improve-questions` - Generate clarifying questions
- `/smart-improve-generate` - Generate improved prompt

**Input (questions)**:
```json
{
  "prompt": "User's original prompt",
  "user_id": "uuid"
}
```

**Output (questions)**:
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is the target audience?",
      "type": "text"
    }
  ]
}
```

**Input (generate)**:
```json
{
  "original_prompt": "User's original prompt",
  "answers": [
    {
      "question_id": "q1",
      "answer": "B2B sales professionals"
    }
  ],
  "user_id": "uuid"
}
```

**Output (generate)**:
```json
{
  "improved_prompt": "Enhanced prompt with context"
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
