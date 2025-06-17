-- Add username column to users table
ALTER TABLE neon_auth.users_sync 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Update existing users or insert demo users
INSERT INTO neon_auth.users_sync (username, email, name, role, created_at, updated_at) VALUES
('admin', 'admin@inventory.com', 'System Administrator', 'admin', NOW(), NOW()),
('user', 'user@inventory.com', 'Regular User', 'user', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
username = EXCLUDED.username,
role = EXCLUDED.role,
updated_at = NOW();

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON neon_auth.users_sync(username);
