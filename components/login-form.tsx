"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package2, Zap } from "lucide-react"
import { useAuth } from "./auth-provider"

interface ExistingUser {
  id: string
  email: string
  name: string
  role: string
  username: string
}

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([])
  const [checkingUsers, setCheckingUsers] = useState(true)
  const { login } = useAuth()

  useEffect(() => {
    checkExistingUsers()
  }, [])

  const checkExistingUsers = async () => {
    try {
      const response = await fetch("/api/auth/check-users")
      if (response.ok) {
        const data = await response.json()
        setExistingUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error checking users:", error)
    } finally {
      setCheckingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const success = await login(username, password)

    if (!success) {
      setError("Invalid username or password. Use 'admin'/'admin123' or 'user'/'user123'")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <div className="relative">
                <Package2 className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Zap className="h-2.5 w-2.5 text-yellow-800" />
                </div>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 mb-1">SmartStock</CardTitle>
          <CardDescription className="text-slate-600">
            Smart Inventory Management System
            <br />
            <span className="text-sm text-slate-500">Streamline your inventory with intelligent automation</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In to SmartStock
            </Button>
          </form>

          <div className="text-xs text-center text-slate-600 bg-slate-50 p-4 rounded-lg space-y-2">
            <p className="font-semibold text-slate-700">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-white p-2 rounded border">
                <p className="font-medium text-blue-700">Administrator</p>
                <p className="text-xs">
                  Username: <span className="font-mono">admin</span>
                </p>
                <p className="text-xs">
                  Password: <span className="font-mono">admin123</span>
                </p>
              </div>
              <div className="bg-white p-2 rounded border">
                <p className="font-medium text-green-700">Regular User</p>
                <p className="text-xs">
                  Username: <span className="font-mono">user</span>
                </p>
                <p className="text-xs">
                  Password: <span className="font-mono">user123</span>
                </p>
              </div>
            </div>
          </div>

          {/* Show additional users if available */}
          {!checkingUsers && existingUsers.length > 2 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Additional Users</span>
                </div>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {existingUsers.slice(2).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-slate-500">@{user.username}</div>
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Features highlight */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-slate-500 mb-2">✨ Smart Features</p>
            <div className="flex justify-center gap-4 text-xs text-slate-600">
              <span>📊 Analytics</span>
              <span>🔄 Real-time</span>
              <span>📱 Responsive</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
