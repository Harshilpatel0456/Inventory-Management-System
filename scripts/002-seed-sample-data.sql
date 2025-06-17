-- Insert sample products
INSERT INTO products (name, sku, category, price, stock, min_stock, description, supplier) VALUES
('Wireless Headphones', 'WH-001', 'Electronics', 99.99, 45, 10, 'High-quality wireless headphones with noise cancellation', 'TechCorp'),
('Gaming Mouse', 'GM-002', 'Electronics', 59.99, 8, 15, 'Ergonomic gaming mouse with RGB lighting', 'GameTech'),
('Office Chair', 'OC-003', 'Furniture', 299.99, 25, 5, 'Ergonomic office chair with lumbar support', 'FurniturePlus'),
('Bluetooth Speaker', 'BS-004', 'Electronics', 79.99, 30, 8, 'Portable Bluetooth speaker with excellent sound quality', 'AudioMax'),
('Standing Desk', 'SD-005', 'Furniture', 449.99, 12, 3, 'Height-adjustable standing desk', 'FurniturePlus')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample stock movements
INSERT INTO stock_movements (product_id, type, quantity, reason, notes) 
SELECT 
    p.id,
    'in',
    20,
    'Initial Stock',
    'Product added to inventory'
FROM products p
WHERE p.sku IN ('WH-001', 'GM-002', 'OC-003', 'BS-004', 'SD-005');

-- Insert sample sales
INSERT INTO sales (product_id, quantity, unit_price, total_amount, customer)
SELECT 
    p.id,
    3,
    p.price,
    p.price * 3,
    'John Doe'
FROM products p
WHERE p.sku = 'WH-001'
LIMIT 1;

INSERT INTO sales (product_id, quantity, unit_price, total_amount, customer)
SELECT 
    p.id,
    2,
    p.price,
    p.price * 2,
    'Jane Smith'
FROM products p
WHERE p.sku = 'GM-002'
LIMIT 1;
