ALTER TABLE tasks ADD COLUMN assignee_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN assignee_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE goals ADD COLUMN assignee_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE job_applications ADD COLUMN assignee_id INT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_projects_assignee_id ON projects(assignee_id);
CREATE INDEX idx_goals_assignee_id ON goals(assignee_id);
CREATE INDEX idx_job_applications_assignee_id ON job_applications(assignee_id);
