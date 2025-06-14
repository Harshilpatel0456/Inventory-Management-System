import { neon } from "@neondatabase/serverless"
import { initializeDatabase } from "./init-database"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  role: "admin" | "user"
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  product_code: string
  name: string
  description: string
  sku: string
  price: number
  current_stock: number
  min_stock_level: number
  category: string
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: number
  movement_code: string
  product_id: number
  movement_type: "in" | "out"
  quantity: number
  reason: string
  user_id: number
  created_at: string
}

export interface Sale {
  id: number
  sale_code: string
  product_id: number
  quantity: number
  unit_price: number
  total_amount: number
  customer_name: string
  user_id: number
  created_at: string
}

// Helper function to ensure database is initialized
export async function ensureDatabase() {
  try {
    // Test if tables exist by running a simple query
    await sql`SELECT 1 FROM users LIMIT 1`
    return true
  } catch (error) {
    console.log("Database not initialized, initializing now...")
    return await initializeDatabase()
  }
}

// Helper function to generate a unique code without relying on the database function
async function generateUniqueCode(prefix: string): Promise<string> {
  try {
    // Try to use the database function first
    const result = await sql`SELECT generate_unique_code(${prefix}) as code`
    return result[0]?.code
  } catch (error) {
    // Fallback if the function doesn't exist
    console.error("Error using generate_unique_code function:", error)

    // Generate a simple unique code based on timestamp and random number
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}${timestamp}${random}`
  }
}

// User functions
export async function getUserByUsername(username: string): Promise<User | null> {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `
    console.log(`Database query for user ${username}:`, result[0] ? "Found" : "Not found")
    return result[0] || null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

export async function createUser(userData: Omit<User, "id" | "created_at" | "updated_at">) {
  await ensureDatabase()
  const result = await sql`
    INSERT INTO users (username, email, password_hash, role)
    VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, ${userData.role})
    RETURNING *
  `
  return result[0]
}

// Product functions
export async function getAllProducts(): Promise<Product[]> {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT * FROM products ORDER BY created_at DESC
    `
    return result as Product[]
  } catch (error) {
    console.error("Error getting products:", error)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT * FROM products WHERE id = ${id} LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error getting product:", error)
    return null
  }
}

export async function createProduct(productData: Omit<Product, "id" | "product_code" | "created_at" | "updated_at">) {
  await ensureDatabase()
  try {
    // Generate unique product code
    const productCode = await generateUniqueCode("PRD")

    const result = await sql`
      INSERT INTO products (product_code, name, description, sku, price, current_stock, min_stock_level, category)
      VALUES (
        ${productCode},
        ${productData.name},
        ${productData.description},
        ${productData.sku},
        ${productData.price},
        ${productData.current_stock},
        ${productData.min_stock_level},
        ${productData.category}
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProduct(id: number, productData: Partial<Product>) {
  await ensureDatabase()
  try {
    const result = await sql`
      UPDATE products 
      SET 
        name = COALESCE(${productData.name}, name),
        description = COALESCE(${productData.description}, description),
        sku = COALESCE(${productData.sku}, sku),
        price = COALESCE(${productData.price}, price),
        current_stock = COALESCE(${productData.current_stock}, current_stock),
        min_stock_level = COALESCE(${productData.min_stock_level}, min_stock_level),
        category = COALESCE(${productData.category}, category),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProduct(id: number) {
  await ensureDatabase()
  try {
    await sql`DELETE FROM products WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Stock movement functions
export async function getAllStockMovements() {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT sm.*, p.name as product_name, p.sku as product_sku, u.username
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.user_id = u.id
      ORDER BY sm.created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error getting stock movements:", error)
    return []
  }
}

export async function createStockMovement(movementData: Omit<StockMovement, "id" | "movement_code" | "created_at">) {
  await ensureDatabase()
  try {
    // Generate unique movement code
    const movementCode = await generateUniqueCode("STK")

    const result = await sql`
      INSERT INTO stock_movements (movement_code, product_id, movement_type, quantity, reason, user_id)
      VALUES (
        ${movementCode},
        ${movementData.product_id},
        ${movementData.movement_type},
        ${movementData.quantity},
        ${movementData.reason},
        ${movementData.user_id}
      )
      RETURNING *
    `

    // Update product stock
    if (movementData.movement_type === "in") {
      await sql`
        UPDATE products 
        SET current_stock = current_stock + ${movementData.quantity}
        WHERE id = ${movementData.product_id}
      `
    } else {
      await sql`
        UPDATE products 
        SET current_stock = current_stock - ${movementData.quantity}
        WHERE id = ${movementData.product_id}
      `
    }

    return result[0]
  } catch (error) {
    console.error("Error creating stock movement:", error)
    throw error
  }
}

// Sales functions
export async function getAllSales() {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT s.*, p.name as product_name, p.sku as product_sku, u.username
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error getting sales:", error)
    return []
  }
}

export async function createSale(saleData: Omit<Sale, "id" | "sale_code" | "created_at">) {
  await ensureDatabase()
  try {
    // Generate unique sale code
    const saleCode = await generateUniqueCode("SAL")

    const result = await sql`
      INSERT INTO sales (sale_code, product_id, quantity, unit_price, total_amount, customer_name, user_id)
      VALUES (
        ${saleCode},
        ${saleData.product_id},
        ${saleData.quantity},
        ${saleData.unit_price},
        ${saleData.total_amount},
        ${saleData.customer_name},
        ${saleData.user_id}
      )
      RETURNING *
    `

    // Update product stock
    await sql`
      UPDATE products 
      SET current_stock = current_stock - ${saleData.quantity}
      WHERE id = ${saleData.product_id}
    `

    return result[0]
  } catch (error) {
    console.error("Error creating sale:", error)
    throw error
  }
}

// Dashboard functions
export async function getDashboardStats() {
  await ensureDatabase()
  try {
    const [products, lowStock, sales] = await Promise.all([
      sql`SELECT COUNT(*) as total FROM products`,
      sql`SELECT COUNT(*) as total FROM products WHERE current_stock <= min_stock_level`,
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`,
    ])

    return {
      totalProducts: Number(products[0]?.total || 0),
      lowStockProducts: Number(lowStock[0]?.total || 0),
      totalSales: Number(sales[0]?.total || 0),
    }
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    return {
      totalProducts: 0,
      lowStockProducts: 0,
      totalSales: 0,
    }
  }
}

export async function getLowStockProducts() {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT product_code, name, current_stock, min_stock_level
      FROM products 
      WHERE current_stock <= min_stock_level
      ORDER BY current_stock ASC
    `
    return result
  } catch (error) {
    console.error("Error getting low stock products:", error)
    return []
  }
}

export async function getRecentSales(limit = 5) {
  await ensureDatabase()
  try {
    const result = await sql`
      SELECT s.sale_code, s.quantity, s.total_amount, s.customer_name, s.created_at,
             p.name as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `
    return result
  } catch (error) {
    console.error("Error getting recent sales:", error)
    return []
  }
}

// Internal helper function to ensure database is initialized
async function _ensureDatabaseInternal() {
  return await ensureDatabase()
}
