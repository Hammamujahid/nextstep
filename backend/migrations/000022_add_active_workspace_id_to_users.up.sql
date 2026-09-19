ALTER TABLE users ADD COLUMN active_workspace_id INT REFERENCES workspaces(id) ON DELETE SET NULL;
