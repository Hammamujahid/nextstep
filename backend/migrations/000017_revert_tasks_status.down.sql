ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE tasks SET is_completed = (status = 'completed');
ALTER TABLE tasks DROP COLUMN status;
CREATE INDEX idx_tasks_is_completed ON tasks(workspace_id, is_completed);
