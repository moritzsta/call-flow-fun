-- Add 'alive' to workflow_status enum
ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'alive';