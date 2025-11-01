-- Phase 1: Create workflow_messages table for chat history
CREATE TABLE IF NOT EXISTS workflow_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_state_id UUID NOT NULL REFERENCES n8n_workflow_states(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_messages_workflow ON workflow_messages(workflow_state_id);
CREATE INDEX IF NOT EXISTS idx_workflow_messages_project ON workflow_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_messages_created ON workflow_messages(created_at DESC);

-- RLS Policies
ALTER TABLE workflow_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_messages_select_policy" ON workflow_messages
  FOR SELECT USING (
    has_project_access(auth.uid(), project_id)
  );

CREATE POLICY "workflow_messages_insert_policy" ON workflow_messages
  FOR INSERT WITH CHECK (
    has_project_access(auth.uid(), project_id)
  );

-- Realtime for live updates
ALTER TABLE workflow_messages REPLICA IDENTITY FULL;

-- Extend n8n_workflow_states with conversation tracking
ALTER TABLE n8n_workflow_states
ADD COLUMN IF NOT EXISTS conversation_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();