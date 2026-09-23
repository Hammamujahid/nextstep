DROP INDEX IF EXISTS idx_job_applications_assignee_id;
DROP INDEX IF EXISTS idx_goals_assignee_id;
DROP INDEX IF EXISTS idx_projects_assignee_id;
DROP INDEX IF EXISTS idx_tasks_assignee_id;
ALTER TABLE job_applications DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE goals DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE projects DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;
