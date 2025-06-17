-- Remove all sample data from the database
DELETE FROM sales;
DELETE FROM stock_movements;
DELETE FROM products;

-- Reset any sequences if needed (PostgreSQL will handle this automatically)
-- The tables are now clean and ready for fresh data
