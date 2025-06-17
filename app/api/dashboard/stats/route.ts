import { NextResponse } from "next/server"
import { getDashboardStats, testConnection } from "@/lib/database"

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

    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Dashboard stats API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics. Please try again later." },
      { status: 500 },
    )
  }
}
