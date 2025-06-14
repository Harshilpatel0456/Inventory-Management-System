import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function initializeDatabase() {
  try {
    // Check if tables already exist
    const tablesExist = await checkTablesExist()

    if (!tablesExist) {
      // Create tables only if they don't exist
      await createTables()
      await createFunctions()
      await seedInitialData()
      console.log("Database initialized successfully")
    } else {
      // Even if tables exist, ensure users are seeded
      await ensureUsersExist()
      console.log("Database tables already exist, ensured users are present")
    }

    return true
  } catch (error) {
    console.error("Database initialization error:", error)
    return false
  }
}

async function checkTablesExist() {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      ) as exists
    `
    return result[0]?.exists || false
  } catch (error) {
    console.error("Error checking if tables exist:", error)
    return false
  }
}

async function createTables() {
  // Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Create products table
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      product_code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      sku VARCHAR(50) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      current_stock INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      category VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Create stock_movements table
  await sql`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      movement_code VARCHAR(20) UNIQUE NOT NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      movement_type VARCHAR(10) CHECK (movement_type IN ('in', 'out')),
      quantity INTEGER NOT NULL,
      reason VARCHAR(100),
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Create sales table
  await sql`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      sale_code VARCHAR(20) UNIQUE NOT NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      customer_name VARCHAR(100),
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

async function createFunctions() {
  try {
    // Check if function exists first
    const functionExists = await sql`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
        WHERE proname = 'generate_unique_code' 
        AND pg_namespace.nspname = 'public'
      ) as exists
    `

    if (!functionExists[0]?.exists) {
      // Create function to generate unique codes
      await sql`
        CREATE OR REPLACE FUNCTION generate_unique_code(prefix TEXT)
        RETURNS TEXT AS $$
        DECLARE
          new_code TEXT;
          counter INTEGER := 1;
        BEGIN
          LOOP
            new_code := prefix || LPAD(counter::TEXT, 6, '0');
            -- Check if code exists in any table
            IF NOT EXISTS (
              SELECT 1 FROM products WHERE product_code = new_code
              UNION ALL
              SELECT 1 FROM stock_movements WHERE movement_code = new_code
              UNION ALL
              SELECT 1 FROM sales WHERE sale_code = new_code
            ) THEN
              RETURN new_code;
            END IF;
            counter := counter + 1;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `
      console.log("Created generate_unique_code function")
    } else {
      console.log("generate_unique_code function already exists")
    }
  } catch (error) {
    console.error("Error creating function:", error)
    // Continue execution even if function creation fails
  }
}

async function ensureUsersExist() {
  try {
    // Insert default admin user if not exists
    await sql`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES ('admin', 'admin@smartstock.com', 'admin123', 'admin')
      ON CONFLICT (username) DO NOTHING
    `

    // Insert default regular user if not exists
    await sql`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES ('harshil', 'harshil@smartstock.com', 'user123', 'user')
      ON CONFLICT (username) DO NOTHING
    `

    console.log("Ensured both admin and harshil users exist")
  } catch (error) {
    console.error("Error ensuring users exist:", error)
  }
}

async function seedInitialData() {
  // Ensure users exist
  await ensureUsersExist()

  // Insert sample products if table is empty
  const productCount = await sql`SELECT COUNT(*) as count FROM products`

  if (productCount[0].count === 0) {
    // Generate product codes manually for initial data
    await sql`
      INSERT INTO products (product_code, name, description, sku, price, current_stock, min_stock_level, category) VALUES 
      ('PRD000001', 'Laptop Dell XPS 13', 'High-performance ultrabook', 'DELL-XPS-13', 129999.99, 15, 5, 'Electronics'),
      ('PRD000002', 'iPhone 15 Pro', 'Latest Apple smartphone', 'IPHONE-15-PRO', 99999.99, 8, 3, 'Electronics'),
      ('PRD000003', 'Office Chair', 'Ergonomic office chair', 'CHAIR-ERG-001', 29999.99, 25, 10, 'Furniture'),
      ('PRD000004', 'Wireless Mouse', 'Bluetooth wireless mouse', 'MOUSE-BT-001', 2599.99, 50, 20, 'Accessories'),
      ('PRD000005', 'Monitor 27"', '4K UHD monitor', 'MON-27-4K', 45999.99, 12, 5, 'Electronics')
    `
  }
}
