-- Only perform safe operations that won't conflict with existing constraints

-- Try to add role column if it doesn't exist (safe operation)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'neon_auth' 
                   AND table_name = 'users_sync' 
                   AND column_name = 'role') THEN
        ALTER TABLE neon_auth.users_sync 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        
        -- Add constraint
        ALTER TABLE neon_auth.users_sync 
        ADD CONSTRAINT users_sync_role_check CHECK (role IN ('admin', 'user'));
    END IF;
END $$;

-- Try to add username column if it doesn't exist (safe operation)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'neon_auth' 
                   AND table_name = 'users_sync' 
                   AND column_name = 'username') THEN
        ALTER TABLE neon_auth.users_sync 
        ADD COLUMN username VARCHAR(50);
        
        -- Create index for username lookups
        CREATE INDEX IF NOT EXISTS idx_users_username ON neon_auth.users_sync(username);
    END IF;
END $$;

-- Update existing users to have roles (safe operation)
UPDATE neon_auth.users_sync 
SET role = 'admin' 
WHERE role IS NULL 
AND id = (SELECT id FROM neon_auth.users_sync WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1);

UPDATE neon_auth.users_sync 
SET role = 'user' 
WHERE role IS NULL AND deleted_at IS NULL;

-- Update usernames based on email (safe operation)
UPDATE neon_auth.users_sync 
SET username = split_part(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL AND deleted_at IS NULL;
