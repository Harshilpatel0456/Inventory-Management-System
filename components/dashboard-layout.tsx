"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Package, TrendingUp, Users, LogOut, Home, ShoppingCart, BarChart3, User } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    if (typeof window !== "undefined") {
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen relative">
          {/* Header */}
          <div className="p-6 bg-blue-600 text-white">
            <h1 className="text-xl font-bold">SmartStock</h1>
            <p className="text-xs text-blue-100 mt-1">Inventory Management</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === "admin" ? "secondary" : "outline"} className="text-xs">
                    {user.role}
                  </Badge>
                </div>
                <span className="text-sm text-blue-100">{user.username}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700">
                <Home className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700">
                <Package className="mr-3 h-4 w-4" />
                Products
              </Button>
            </Link>
            <Link href="/stock">
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700">
                <TrendingUp className="mr-3 h-4 w-4" />
                Stock Management
              </Button>
            </Link>
            <Link href="/sales">
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700">
                <ShoppingCart className="mr-3 h-4 w-4" />
                Sales
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700">
                <BarChart3 className="mr-3 h-4 w-4" />
                Reports
              </Button>
            </Link>
            {user.role === "admin" && (
              <Link href="/users">
                <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700">
                  <Users className="mr-3 h-4 w-4" />
                  User Management
                </Button>
              </Link>
            )}
          </nav>

          {/* Logout Button - Smaller and positioned at bottom */}
          <div className="absolute bottom-6 left-4 right-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-3 w-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Welcome back, <span className="font-medium text-gray-700">{user.username}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
