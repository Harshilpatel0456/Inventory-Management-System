import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getDemoUsers } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get demo users
    const demoUsers = getDemoUsers()

    // Try to get database users as well
    let dbUsers: any[] = []
    try {
      dbUsers = await sql`
        SELECT id, email, name, role, created_at 
        FROM neon_auth.users_sync 
        WHERE deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 5
      `
    } catch (error) {
      console.log("Could not fetch database users:", error)
    }

    // Combine demo and database users
    const allUsers = [
      ...demoUsers,
      ...dbUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || "Database User",
        role: u.role || "user",
        username: u.email?.split("@")[0] || "user",
      })),
    ]

    return NextResponse.json({
      users: allUsers,
      count: allUsers.length,
    })
  } catch (error) {
    console.error("Check users error:", error)
    return NextResponse.json({
      users: getDemoUsers(), // Fallback to demo users only
      count: getDemoUsers().length,
    })
  }
}
