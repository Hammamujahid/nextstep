-- 000016: replace status with is_completed + add priority (3 levels)
ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrasi data lama: status 'completed' -> is_completed true, lainnya false
UPDATE tasks SET is_completed = (status = 'completed');

-- Hapus kolom status beserta CHECK constraint-nya
ALTER TABLE tasks DROP COLUMN status;

-- Index untuk ordering default NextSteps: priority + due_date terdekat
CREATE INDEX idx_tasks_priority_due_date ON tasks(workspace_id, priority, due_date);
CREATE INDEX idx_tasks_is_completed ON tasks(workspace_id, is_completed);
