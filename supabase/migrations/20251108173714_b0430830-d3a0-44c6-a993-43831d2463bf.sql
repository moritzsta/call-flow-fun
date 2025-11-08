-- Remove index on body_improved column to allow storing large HTML content
DROP INDEX IF EXISTS idx_project_emails_body_improved;