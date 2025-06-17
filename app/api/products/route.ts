import { type NextRequest, NextResponse } from "next/server"
import { getProducts, createProduct, testConnection } from "@/lib/database"

export async function GET() {
  try {
    // Test database connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed. Please check your DATABASE_URL environment variable." },
        { status: 500 },
      )
    }

    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Failed to fetch products. Please try again later." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection failed. Please check your DATABASE_URL environment variable." },
        { status: 500 },
      )
    }

    const productData = await request.json()
    const product = await createProduct(productData)

    if (product) {
      return NextResponse.json(product)
    } else {
      return NextResponse.json({ error: "Failed to create product" }, { status: 400 })
    }
  } catch (error) {
    console.error("Create product API error:", error)
    return NextResponse.json({ error: "Failed to create product. Please try again later." }, { status: 500 })
  }
}
