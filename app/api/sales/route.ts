import { type NextRequest, NextResponse } from "next/server"
import { getAllSales, createSale } from "@/lib/database"

export async function GET() {
  try {
    const sales = await getAllSales()
    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const saleData = await request.json()

    // Validate required fields
    if (!saleData.product_id || !saleData.quantity || !saleData.unit_price || !saleData.customer_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newSale = await createSale(saleData)
    return NextResponse.json(newSale, { status: 201 })
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
