-- 000019: tambah due_date + status under_review (otomatis saat lewat due date)
ALTER TABLE job_applications ADD COLUMN due_date TIMESTAMP NULL;
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check CHECK (status IN ('wishlist', 'applied', 'under_review', 'interviewing', 'offered', 'rejected'));
CREATE INDEX idx_job_applications_due_date ON job_applications(workspace_id, due_date);
