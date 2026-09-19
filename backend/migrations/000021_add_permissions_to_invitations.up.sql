ALTER TABLE workspace_invitations
    ADD COLUMN project_permission VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (project_permission IN ('none', 'viewer', 'editor')),
    ADD COLUMN task_permission VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (task_permission IN ('none', 'viewer', 'editor')),
    ADD COLUMN goal_permission VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (goal_permission IN ('none', 'viewer', 'editor')),
    ADD COLUMN job_application_permission VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (job_application_permission IN ('none', 'viewer', 'editor'));
