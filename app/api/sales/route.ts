import { type NextRequest, NextResponse } from "next/server"
import { getSales, createSale } from "@/lib/database"

export async function GET() {
  try {
    const sales = await getSales()
    return NextResponse.json(sales)
  } catch (error) {
    console.error("Sales API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const saleData = await request.json()
    const { userId } = saleData

    const sale = await createSale(saleData, userId)

    if (sale) {
      return NextResponse.json(sale)
    } else {
      return NextResponse.json({ error: "Failed to create sale" }, { status: 400 })
    }
  } catch (error) {
    console.error("Create sale API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
