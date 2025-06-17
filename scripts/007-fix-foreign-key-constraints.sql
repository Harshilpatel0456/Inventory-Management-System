-- Remove the foreign key constraint that's causing issues
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_created_by_fkey;

-- Remove the foreign key constraint from sales table as well
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_created_by_fkey;

-- Make created_by a simple text field instead of a foreign key
-- This allows us to store user information without strict referential integrity
ALTER TABLE stock_movements ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE sales ALTER COLUMN created_by TYPE TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);
