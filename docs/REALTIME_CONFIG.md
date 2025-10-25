# Realtime Configuration

## Overview

Supabase Realtime ist für die `n8n_workflow_states` Tabelle aktiviert. Dies ermöglicht Echtzeit-Updates der Workflow-Status in der App.

## Aktivierte Tabellen

### `n8n_workflow_states`

- **Replica Identity**: FULL
- **Publication**: `supabase_realtime`
- **Zweck**: Echtzeit-Updates für n8n-Workflow-Status

## Frontend Integration

### Basic Subscription

```typescript
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

useEffect(() => {
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'n8n_workflow_states'
      },
      (payload) => {
        console.log('Workflow state changed:', payload);
        // Handle update in your component
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Filter by Project

```typescript
const channel = supabase
  .channel(`project-${projectId}-workflows`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'n8n_workflow_states',
      filter: `project_id=eq.${projectId}`
    },
    (payload) => {
      console.log('Project workflow changed:', payload);
    }
  )
  .subscribe();
```

### Filter by Status

```typescript
const channel = supabase
  .channel('running-workflows')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'n8n_workflow_states',
      filter: 'status=eq.running'
    },
    (payload) => {
      console.log('Workflow running:', payload);
    }
  )
  .subscribe();
```

## Use Cases

### 1. Workflow Status Updates

Zeige in Echtzeit den Status eines laufenden Workflows (z.B. Finder Felix):

- **pending** → Workflow wartet auf Ausführung
- **running** → Workflow läuft gerade
- **completed** → Workflow erfolgreich abgeschlossen
- **failed** → Workflow fehlgeschlagen

### 2. Progress Tracking

Zeige eine Progress-Bar oder Toast-Notification, wenn sich der Status ändert:

```typescript
supabase
  .channel('workflow-progress')
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'n8n_workflow_states' 
  }, (payload) => {
    const { status, workflow_name } = payload.new;
    
    if (status === 'completed') {
      toast.success(`${workflow_name} abgeschlossen!`);
    } else if (status === 'failed') {
      toast.error(`${workflow_name} fehlgeschlagen.`);
    }
  })
  .subscribe();
```

### 3. Multi-User Collaboration

Zeige anderen Team-Mitgliedern, wenn ein Workflow gestartet wurde:

```typescript
supabase
  .channel('team-workflows')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'n8n_workflow_states',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    const { workflow_name, user_id } = payload.new;
    // Zeige Notification: "User X hat Workflow Y gestartet"
  })
  .subscribe();
```

## Performance Considerations

- **Channel-Cleanup**: Immer `supabase.removeChannel(channel)` in `useEffect` Cleanup aufrufen
- **Filter nutzen**: Nutze `filter` um nur relevante Updates zu erhalten
- **Throttling**: Bei vielen Updates, nutze Debouncing/Throttling im Handler
- **Connection Limits**: Maximale Anzahl an gleichzeitigen Channels beachten

## Debugging

### Test Realtime Connection

```typescript
const channel = supabase.channel('test-channel');

channel.on('system', {}, (payload) => {
  console.log('System event:', payload);
});

channel.subscribe((status) => {
  console.log('Subscription status:', status);
  // Status: 'SUBSCRIBED', 'TIMED_OUT', 'CLOSED'
});
```

### Check Active Subscriptions

```typescript
const channels = supabase.getChannels();
console.log('Active channels:', channels);
```

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- Feature Library: `docs/feature-library/07-Communication-Realtime-Pattern.md`
