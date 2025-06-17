import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userData = await request.json()

    const result = await sql`
      UPDATE neon_auth.users_sync 
      SET email = ${userData.email}, name = ${userData.name}, username = ${userData.username}, 
          role = ${userData.role}, updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id, email, name, username, role, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update user API error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await sql`
      UPDATE neon_auth.users_sync 
      SET deleted_at = NOW()
      WHERE id = ${params.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user API error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 400 })
  }
}
