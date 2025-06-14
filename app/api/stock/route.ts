import { type NextRequest, NextResponse } from "next/server"
import { getAllStockMovements, createStockMovement } from "@/lib/database"

export async function GET() {
  try {
    const movements = await getAllStockMovements()
    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const movementData = await request.json()

    // Validate required fields
    if (!movementData.product_id || !movementData.movement_type || !movementData.quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newMovement = await createStockMovement(movementData)
    return NextResponse.json(newMovement, { status: 201 })
  } catch (error) {
    console.error("Error creating stock movement:", error)
    return NextResponse.json({ error: "Failed to create stock movement" }, { status: 500 })
  }
}
