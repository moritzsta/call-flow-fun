-- Enable realtime for project_emails table
ALTER TABLE project_emails REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE project_emails;