-- 000017: revert is_completed -> status (not_started, in_progress, completed), keep priority
ALTER TABLE tasks ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed'));

UPDATE tasks SET status = CASE WHEN is_completed = true THEN 'completed' ELSE 'not_started' END;

ALTER TABLE tasks DROP COLUMN is_completed;
DROP INDEX IF EXISTS idx_tasks_is_completed;
-- idx_tasks_priority_due_date tetap untuk NextSteps ordering
