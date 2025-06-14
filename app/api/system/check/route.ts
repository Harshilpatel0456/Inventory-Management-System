import { NextResponse } from "next/server"
import { ensureDatabase } from "@/lib/database"

export async function GET() {
  try {
    const result = await ensureDatabase()

    return NextResponse.json({
      status: "success",
      databaseInitialized: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("System check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
