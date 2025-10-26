-- Performance Optimization: Add Indexes for frequently queried fields

-- Companies table indexes (already has project_id from Task 007, adding more)
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_phone ON companies(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry) WHERE industry IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_companies_project_status ON companies(project_id, status);
CREATE INDEX IF NOT EXISTS idx_companies_project_created ON companies(project_id, created_at DESC);

-- Project emails table indexes
CREATE INDEX IF NOT EXISTS idx_project_emails_project_id ON project_emails(project_id);
CREATE INDEX IF NOT EXISTS idx_project_emails_company_id ON project_emails(company_id);
CREATE INDEX IF NOT EXISTS idx_project_emails_status ON project_emails(status);
CREATE INDEX IF NOT EXISTS idx_project_emails_recipient ON project_emails(recipient_email);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_project_emails_project_status ON project_emails(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_emails_project_created ON project_emails(project_id, created_at DESC);

-- Workflow states table indexes
CREATE INDEX IF NOT EXISTS idx_workflow_states_project_id ON n8n_workflow_states(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_workflow_name ON n8n_workflow_states(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_states_status ON n8n_workflow_states(status);
CREATE INDEX IF NOT EXISTS idx_workflow_states_user_id ON n8n_workflow_states(user_id);

-- Composite indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_workflow_states_project_status ON n8n_workflow_states(project_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_states_project_workflow ON n8n_workflow_states(project_id, workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_states_started_at ON n8n_workflow_states(started_at DESC);

-- Organization members table indexes (for role-based access checks)
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- Composite index for common access checks
CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON organization_members(organization_id, user_id);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Composite index for listing active projects
CREATE INDEX IF NOT EXISTS idx_projects_org_archived ON projects(organization_id, archived);