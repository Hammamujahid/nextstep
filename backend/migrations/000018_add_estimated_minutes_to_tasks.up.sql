-- 000018: tambah estimasi waktu pengerjaan (menit) agar bisa di-custom
ALTER TABLE tasks ADD COLUMN estimated_minutes INT NOT NULL DEFAULT 30 CHECK (estimated_minutes > 0);
