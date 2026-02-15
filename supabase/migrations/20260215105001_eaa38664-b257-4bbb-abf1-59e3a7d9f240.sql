
-- Step 1: Delete workflow_messages for Test Org projects
DELETE FROM public.workflow_messages 
WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc');

-- Step 2: Delete automation_pipelines (must come before n8n_workflow_states due to FK)
DELETE FROM public.automation_pipelines 
WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc');

-- Step 3: Delete n8n_workflow_states
DELETE FROM public.n8n_workflow_states 
WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc');

-- Step 4: Delete project_emails (must come before companies due to FK)
DELETE FROM public.project_emails 
WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc');

-- Step 5: Delete companies
DELETE FROM public.companies 
WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc');

-- Step 6: Delete scheduled_felix_runs
DELETE FROM public.scheduled_felix_runs 
WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc');

-- Step 7: Delete projects
DELETE FROM public.projects 
WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc';

-- Step 8: Delete organization_members
DELETE FROM public.organization_members 
WHERE organization_id = '7dd58b41-923c-4805-b47c-a82e405bf3cc';

-- Step 9: Delete the organization itself
DELETE FROM public.organizations 
WHERE id = '7dd58b41-923c-4805-b47c-a82e405bf3cc';
