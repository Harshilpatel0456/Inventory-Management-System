import { NextResponse } from "next/server"
import { getDashboardStats, getLowStockProducts, getRecentSales } from "@/lib/database"

export async function GET() {
  try {
    // Use Promise.allSettled to handle partial failures
    const [statsResult, lowStockResult, salesResult] = await Promise.allSettled([
      getDashboardStats(),
      getLowStockProducts(),
      getRecentSales(3),
    ])

    // Extract data or provide defaults for failed promises
    const stats =
      statsResult.status === "fulfilled"
        ? statsResult.value
        : {
            totalProducts: 0,
            lowStockProducts: 0,
            totalSales: 0,
          }

    const lowStockProducts = lowStockResult.status === "fulfilled" ? lowStockResult.value : []
    const recentSales = salesResult.status === "fulfilled" ? salesResult.value : []

    return NextResponse.json({
      stats,
      lowStockProducts,
      recentSales,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    // Return minimal data structure to prevent client errors
    return NextResponse.json(
      {
        stats: {
          totalProducts: 0,
          lowStockProducts: 0,
          totalSales: 0,
        },
        lowStockProducts: [],
        recentSales: [],
        error: "Failed to fetch complete dashboard data",
      },
      { status: 500 },
    )
  }
}
