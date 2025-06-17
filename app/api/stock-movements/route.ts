import { type NextRequest, NextResponse } from "next/server"
import { getStockMovements, createStockMovement } from "@/lib/database"

export async function GET() {
  try {
    const movements = await getStockMovements()
    return NextResponse.json(movements)
  } catch (error) {
    console.error("Stock movements API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const movementData = await request.json()
    const { userId } = movementData

    const movement = await createStockMovement(movementData, userId)

    if (movement) {
      return NextResponse.json(movement)
    } else {
      return NextResponse.json({ error: "Failed to create stock movement" }, { status: 400 })
    }
  } catch (error) {
    console.error("Create stock movement API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
