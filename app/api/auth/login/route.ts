import { type NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log(`Login attempt for username: ${username}`)

    if (!username || !password) {
      console.log("Missing username or password")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Hardcoded credentials for demo purposes
    // In a real app, you would validate against database with proper password hashing
    if ((username === "admin" && password === "admin123") || (username === "harshil" && password === "user123")) {
      // Get user from database or create a default one if not found
      let user = await getUserByUsername(username)

      if (!user) {
        // If database lookup fails, create a temporary user object
        console.log(`User ${username} not found in database, creating temporary user object`)
        user = {
          id: username === "admin" ? 1 : 2,
          username: username,
          email: `${username}@smartstock.com`,
          password_hash: "", // Don't include actual password in response
          role: username === "admin" ? "admin" : "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user

      console.log(`Successful login for user: ${username}`)
      return NextResponse.json({
        user: userWithoutPassword,
        message: "Login successful",
      })
    }

    console.log(`Invalid credentials for username: ${username}`)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
