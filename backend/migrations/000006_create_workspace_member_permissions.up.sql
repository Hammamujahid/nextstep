CREATE TABLE workspace_member_permissions (
    id SERIAL PRIMARY KEY,
    workspace_member_id INT NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
    resource_type VARCHAR(30) NOT NULL CHECK (resource_type IN ('project', 'task', 'goal', 'job_application')),
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('none', 'viewer', 'editor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_member_id, resource_type)
);