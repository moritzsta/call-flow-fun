-- Enable Realtime for workflow_messages table
ALTER TABLE workflow_messages REPLICA IDENTITY FULL;

-- Add workflow_messages to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_messages;