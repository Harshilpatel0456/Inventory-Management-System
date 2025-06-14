-- Insert admin user (password: admin123 - hashed)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@smartstock.com', '$2b$10$rOzJqQZ8kVxHxvQQQQQQQu', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products with unique codes
INSERT INTO products (product_code, name, description, sku, price, current_stock, min_stock_level, category) VALUES 
(generate_unique_code('PRD'), 'Laptop Dell XPS 13', 'High-performance ultrabook', 'DELL-XPS-13', 129999.99, 15, 5, 'Electronics'),
(generate_unique_code('PRD'), 'iPhone 15 Pro', 'Latest Apple smartphone', 'IPHONE-15-PRO', 99999.99, 8, 3, 'Electronics'),
(generate_unique_code('PRD'), 'Office Chair', 'Ergonomic office chair', 'CHAIR-ERG-001', 29999.99, 25, 10, 'Furniture'),
(generate_unique_code('PRD'), 'Wireless Mouse', 'Bluetooth wireless mouse', 'MOUSE-BT-001', 2599.99, 50, 20, 'Accessories'),
(generate_unique_code('PRD'), 'Monitor 27"', '4K UHD monitor', 'MON-27-4K', 45999.99, 12, 5, 'Electronics')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample stock movements
INSERT INTO stock_movements (movement_code, product_id, movement_type, quantity, reason, user_id) 
SELECT 
    generate_unique_code('STK'),
    p.id,
    'in',
    20,
    'Initial stock',
    1
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM stock_movements WHERE product_id = p.id);

-- Insert sample sales
INSERT INTO sales (sale_code, product_id, quantity, unit_price, total_amount, customer_name, user_id)
SELECT 
    generate_unique_code('SAL'),
    p.id,
    2,
    p.price,
    p.price * 2,
    'Sample Customer',
    1
FROM products p
WHERE p.sku = 'DELL-XPS-13'
AND NOT EXISTS (SELECT 1 FROM sales WHERE product_id = p.id);
