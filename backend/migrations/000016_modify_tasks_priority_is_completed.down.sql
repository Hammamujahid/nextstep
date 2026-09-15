DROP INDEX IF EXISTS idx_tasks_is_completed;
DROP INDEX IF EXISTS idx_tasks_priority_due_date;

ALTER TABLE tasks ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'archived'));

UPDATE tasks SET status = CASE WHEN is_completed = true THEN 'completed' ELSE 'not_started' END;

ALTER TABLE tasks DROP COLUMN is_completed;
ALTER TABLE tasks DROP COLUMN priority;
