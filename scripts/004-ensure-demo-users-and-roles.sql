-- Ensure role column exists and has proper constraint
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'neon_auth' 
                   AND table_name = 'users_sync' 
                   AND column_name = 'role') THEN
        ALTER TABLE neon_auth.users_sync 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_schema = 'neon_auth' 
                   AND constraint_name = 'users_sync_role_check') THEN
        ALTER TABLE neon_auth.users_sync 
        ADD CONSTRAINT users_sync_role_check CHECK (role IN ('admin', 'user'));
    END IF;
END $$;

-- Insert or update demo users
INSERT INTO neon_auth.users_sync (email, name, role, created_at, updated_at) VALUES
('admin@inventory.com', 'System Administrator', 'admin', NOW(), NOW()),
('user@inventory.com', 'Regular User', 'user', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
role = EXCLUDED.role,
name = EXCLUDED.name,
updated_at = NOW();

-- Try to add username column (will be ignored if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'neon_auth' 
                   AND table_name = 'users_sync' 
                   AND column_name = 'username') THEN
        ALTER TABLE neon_auth.users_sync 
        ADD COLUMN username VARCHAR(50) UNIQUE;
        
        -- Update existing users with usernames
        UPDATE neon_auth.users_sync 
        SET username = 'admin' 
        WHERE email = 'admin@inventory.com';
        
        UPDATE neon_auth.users_sync 
        SET username = 'user' 
        WHERE email = 'user@inventory.com';
        
        -- Create index for username lookups
        CREATE INDEX IF NOT EXISTS idx_users_username ON neon_auth.users_sync(username);
    END IF;
END $$;
