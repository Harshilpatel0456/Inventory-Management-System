import { type NextRequest, NextResponse } from "next/server"
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
        SELECT id, email, name, role, username, created_at 
        FROM neon_auth.users_sync 
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `
    } catch (error) {
      console.log("Could not fetch database users:", error)
    }

    // Combine demo and database users
    const allUsers = [
      ...demoUsers.map((u) => ({
        ...u,
        created_at: new Date().toISOString(),
      })),
      ...dbUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || "Database User",
        role: u.role || "user",
        username: u.username || u.email?.split("@")[0] || "user",
        created_at: u.created_at,
      })),
    ]

    return NextResponse.json({
      users: allUsers,
      count: allUsers.length,
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({
      users: getDemoUsers().map((u) => ({
        ...u,
        created_at: new Date().toISOString(),
      })),
      count: getDemoUsers().length,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    const result = await sql`
      INSERT INTO neon_auth.users_sync (email, name, username, role, created_at, updated_at)
      VALUES (${userData.email}, ${userData.name}, ${userData.username}, ${userData.role}, NOW(), NOW())
      RETURNING id, email, name, username, role, created_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Create user API error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 })
  }
}
