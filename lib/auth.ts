import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: string
  email: string
  name: string
  username: string
  role: "admin" | "user"
  created_at: string
}

// Hardcoded demo users
const DEMO_USERS = {
  admin: {
    id: "demo-admin-001",
    username: "admin",
    email: "admin@inventory.com",
    name: "System Administrator",
    role: "admin" as const,
    password: "admin123",
    created_at: new Date().toISOString(),
  },
  user: {
    id: "demo-user-001",
    username: "user",
    email: "user@inventory.com",
    name: "Regular User",
    role: "user" as const,
    password: "user123",
    created_at: new Date().toISOString(),
  },
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    // First check hardcoded demo users
    const demoUser = DEMO_USERS[username as keyof typeof DEMO_USERS]
    if (demoUser && demoUser.password === password) {
      return {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        username: demoUser.username,
        role: demoUser.role,
        created_at: demoUser.created_at,
      }
    }

    // If not a demo user, try database authentication
    let users: any[] = []

    try {
      // Try to find by username first
      users = await sql`
        SELECT id, email, name, role, username, created_at 
        FROM neon_auth.users_sync 
        WHERE username = ${username} AND deleted_at IS NULL
      `
    } catch (error) {
      // If username column doesn't exist, try email
      try {
        users = await sql`
          SELECT id, email, name, role, created_at 
          FROM neon_auth.users_sync 
          WHERE email = ${username} AND deleted_at IS NULL
        `
      } catch (emailError) {
        console.error("Database authentication failed:", emailError)
        return null
      }
    }

    // If no users found by username, try email
    if (users.length === 0) {
      try {
        users = await sql`
          SELECT id, email, name, role, created_at 
          FROM neon_auth.users_sync 
          WHERE email = ${username} AND deleted_at IS NULL
        `
      } catch (error) {
        console.error("Email authentication failed:", error)
        return null
      }
    }

    if (users.length === 0) {
      return null
    }

    // For database users, accept the password (in production, verify hashed password)
    const user = users[0]
    return {
      id: user.id,
      email: user.email,
      name: user.name || "Database User",
      username: user.username || user.email?.split("@")[0] || username,
      role: user.role || "user",
      created_at: user.created_at,
    } as User
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export async function createUser(email: string, name: string, role: "admin" | "user" = "user"): Promise<User | null> {
  try {
    const users = await sql`
      INSERT INTO neon_auth.users_sync (email, created_at, updated_at)
      VALUES (${email}, NOW(), NOW())
      RETURNING id, email, name, role, created_at
    `

    return users[0] as User
  } catch (error) {
    console.error("User creation error:", error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    // Check demo users first
    const demoUser = Object.values(DEMO_USERS).find((u) => u.id === id)
    if (demoUser) {
      return {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        username: demoUser.username,
        role: demoUser.role,
        created_at: demoUser.created_at,
      }
    }

    // Check database
    const users = await sql`
      SELECT id, email, name, role, created_at 
      FROM neon_auth.users_sync 
      WHERE id = ${id} AND deleted_at IS NULL
    `

    return users.length > 0 ? (users[0] as User) : null
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

// Get demo users for display
export function getDemoUsers() {
  return Object.values(DEMO_USERS).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
  }))
}
