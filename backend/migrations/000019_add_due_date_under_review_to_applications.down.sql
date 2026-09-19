DROP INDEX IF EXISTS idx_job_applications_due_date;
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check CHECK (status IN ('wishlist', 'applied', 'interviewing', 'offered', 'rejected'));
UPDATE job_applications SET status = 'applied' WHERE status = 'under_review';
ALTER TABLE job_applications DROP COLUMN due_date;
