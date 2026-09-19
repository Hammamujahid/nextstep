ALTER TABLE workspace_invitations
    DROP COLUMN IF EXISTS job_application_permission,
    DROP COLUMN IF EXISTS goal_permission,
    DROP COLUMN IF EXISTS task_permission,
    DROP COLUMN IF EXISTS project_permission;
