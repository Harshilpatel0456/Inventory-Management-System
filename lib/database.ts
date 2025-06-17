import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  min_stock: number
  description: string
  supplier: string
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  product_name?: string
  type: "in" | "out"
  quantity: number
  reason: string
  notes?: string
  created_by?: string
  created_at: string
}

export interface Sale {
  id: string
  product_id: string
  product_name?: string
  quantity: number
  unit_price: number
  total_amount: number
  customer: string
  created_by?: string
  created_at: string
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Products
export async function getProducts(): Promise<Product[]> {
  try {
    // Test connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("Database connection failed")
      return []
    }

    const products = await sql`
      SELECT * FROM products 
      ORDER BY created_at DESC
    `
    return products as Product[]
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at" | "updated_at">,
): Promise<Product | null> {
  try {
    const result = await sql`
      INSERT INTO products (name, sku, category, price, stock, min_stock, description, supplier)
      VALUES (${product.name}, ${product.sku}, ${product.category}, ${product.price}, ${product.stock}, ${product.min_stock}, ${product.description}, ${product.supplier})
      RETURNING *
    `
    return result[0] as Product
  } catch (error) {
    console.error("Error creating product:", error)
    return null
  }
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
  try {
    const result = await sql`
      UPDATE products 
      SET name = ${product.name}, sku = ${product.sku}, category = ${product.category}, 
          price = ${product.price}, stock = ${product.stock}, min_stock = ${product.min_stock},
          description = ${product.description}, supplier = ${product.supplier}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] as Product
  } catch (error) {
    console.error("Error updating product:", error)
    return null
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await sql`DELETE FROM products WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}

// Stock Movements
export async function getStockMovements(): Promise<StockMovement[]> {
  try {
    const movements = await sql`
      SELECT sm.*, p.name as product_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
    `
    return movements as StockMovement[]
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return []
  }
}

export async function createStockMovement(
  movement: Omit<StockMovement, "id" | "created_at">,
  userId?: string,
): Promise<StockMovement | null> {
  try {
    // Use a safe user identifier - either the provided userId or a default
    const safeUserId = userId || "system"

    const result = await sql`
      INSERT INTO stock_movements (product_id, type, quantity, reason, notes, created_by)
      VALUES (${movement.product_id}, ${movement.type}, ${movement.quantity}, ${movement.reason}, ${movement.notes || null}, ${safeUserId})
      RETURNING *
    `

    // Update product stock
    if (movement.type === "in") {
      await sql`
        UPDATE products 
        SET stock = stock + ${movement.quantity}, updated_at = NOW()
        WHERE id = ${movement.product_id}
      `
    } else {
      await sql`
        UPDATE products 
        SET stock = GREATEST(0, stock - ${movement.quantity}), updated_at = NOW()
        WHERE id = ${movement.product_id}
      `
    }

    return result[0] as StockMovement
  } catch (error) {
    console.error("Error creating stock movement:", error)
    return null
  }
}

// Sales
export async function getSales(): Promise<Sale[]> {
  try {
    const sales = await sql`
      SELECT s.*, p.name as product_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      ORDER BY s.created_at DESC
    `
    return sales as Sale[]
  } catch (error) {
    console.error("Error fetching sales:", error)
    return []
  }
}

export async function createSale(sale: Omit<Sale, "id" | "created_at">, userId?: string): Promise<Sale | null> {
  try {
    // Use a safe user identifier - either the provided userId or a default
    const safeUserId = userId || "system"

    const result = await sql`
      INSERT INTO sales (product_id, quantity, unit_price, total_amount, customer, created_by)
      VALUES (${sale.product_id}, ${sale.quantity}, ${sale.unit_price}, ${sale.total_amount}, ${sale.customer}, ${safeUserId})
      RETURNING *
    `

    // Update product stock
    await sql`
      UPDATE products 
      SET stock = GREATEST(0, stock - ${sale.quantity}), updated_at = NOW()
      WHERE id = ${sale.product_id}
    `

    // Create stock movement
    await sql`
      INSERT INTO stock_movements (product_id, type, quantity, reason, notes, created_by)
      VALUES (${sale.product_id}, 'out', ${sale.quantity}, ${"Sale to " + sale.customer}, ${"Sale #" + result[0].id}, ${safeUserId})
    `

    return result[0] as Sale
  } catch (error) {
    console.error("Error creating sale:", error)
    return null
  }
}

// Dashboard Stats
export async function getDashboardStats() {
  try {
    // Test connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("Database connection failed for stats")
      return {
        totalProducts: 0,
        totalStock: 0,
        lowStockProducts: 0,
        totalRevenue: 0,
        stockIn: 0,
        stockOut: 0,
      }
    }

    const [productsCount, totalStock, lowStockCount, totalRevenue, stockIn, stockOut] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM products`,
      sql`SELECT COALESCE(SUM(stock), 0) as total FROM products`,
      sql`SELECT COUNT(*) as count FROM products WHERE stock <= min_stock`,
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`,
      sql`SELECT COALESCE(SUM(quantity), 0) as total FROM stock_movements WHERE type = 'in'`,
      sql`SELECT COALESCE(SUM(quantity), 0) as total FROM stock_movements WHERE type = 'out'`,
    ])

    return {
      totalProducts: Number(productsCount[0].count),
      totalStock: Number(totalStock[0].total) || 0,
      lowStockProducts: Number(lowStockCount[0].count),
      totalRevenue: Number(totalRevenue[0].total) || 0,
      stockIn: Number(stockIn[0].total) || 0,
      stockOut: Number(stockOut[0].total) || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      totalRevenue: 0,
      stockIn: 0,
      stockOut: 0,
    }
  }
}
