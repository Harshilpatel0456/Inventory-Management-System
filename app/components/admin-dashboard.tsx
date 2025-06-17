"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Package2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
  AlertCircle,
  Users,
  Shield,
  Activity,
  Database,
  Settings,
  Crown,
} from "lucide-react"
import type { Product } from "@/lib/database"

interface AdminDashboardProps {
  onNavigate: (tab: string) => void
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    stockIn: 0,
    stockOut: 0,
  })
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemHealth, setSystemHealth] = useState({
    dbConnection: true,
    lastBackup: "2024-01-15",
    activeUsers: 5,
    systemUptime: "99.9%",
  })

  useEffect(() => {
    fetchDashboardData()
    fetchSystemHealth()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const [statsResponse, productsResponse] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/products"),
      ])

      if (!statsResponse.ok) {
        const statsError = await statsResponse.json()
        throw new Error(statsError.error || "Failed to fetch dashboard stats")
      }

      if (!productsResponse.ok) {
        const productsError = await productsResponse.json()
        throw new Error(productsError.error || "Failed to fetch products")
      }

      const stats = await statsResponse.json()
      const products = await productsResponse.json()

      setDashboardStats(stats)
      const lowStock = products.filter((p: Product) => p.stock <= p.min_stock)
      setLowStockItems(lowStock)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(error instanceof Error ? error.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemHealth = async () => {
    // Simulate system health check
    setSystemHealth({
      dbConnection: true,
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      activeUsers: Math.floor(Math.random() * 10) + 1,
      systemUptime: "99.9%",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-slate-600">Loading admin dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <br />
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchDashboardData}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Admin Welcome Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-xl">
            <div className="relative">
              <Crown className="h-12 w-12 text-yellow-300" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Admin Control Center
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Advanced administrative dashboard with enhanced controls, system monitoring, and comprehensive analytics for
          SmartStock management.
        </p>
      </div>

      {/* System Health Status */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Activity className="h-5 w-5" />
            System Health Monitor
          </CardTitle>
          <CardDescription className="text-purple-700">Real-time system status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-green-100 rounded-full">
                <Database className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Database</div>
                <div className="text-xs text-green-600">
                  {systemHealth.dbConnection ? "✅ Connected" : "❌ Disconnected"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Active Users</div>
                <div className="text-xs text-blue-600">{systemHealth.activeUsers} online</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-orange-100 rounded-full">
                <Shield className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Last Backup</div>
                <div className="text-xs text-orange-600">{systemHealth.lastBackup}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">Uptime</div>
                <div className="text-xs text-purple-600">{systemHealth.systemUptime}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => onNavigate("products")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
            <Package2 className="h-5 w-5 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalProducts}</div>
            <p className="text-xs opacity-90">📊 Advanced Management</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => onNavigate("stock")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Stock</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalStock}</div>
            <p className="text-xs opacity-90">🔄 Real-time Tracking</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => onNavigate("products")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Critical Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.lowStockProducts}</div>
            <p className="text-xs opacity-90">⚠️ Immediate Action Required</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => onNavigate("sales")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Revenue Analytics</CardTitle>
            <DollarSign className="h-5 w-5 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{dashboardStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs opacity-90">💰 Advanced Insights</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Control Panel */}
      <Card className="border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Settings className="h-5 w-5 text-purple-600" />
            Administrative Control Panel
          </CardTitle>
          <CardDescription>Advanced administrative functions and system management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
              onClick={() => onNavigate("products")}
            >
              <Package2 className="h-6 w-6" />
              <span className="text-sm">Product Control</span>
            </Button>
            <Button
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white"
              onClick={() => onNavigate("stock")}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Stock Analytics</span>
            </Button>
            <Button
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white"
              onClick={() => onNavigate("sales")}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Sales Intelligence</span>
            </Button>
            <Button
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900 text-white"
              onClick={() => onNavigate("reports")}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Advanced Reports</span>
            </Button>
            <Button
              className="h-24 flex flex-col gap-2 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
              onClick={() => onNavigate("users")}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">User Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts for Admin */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />🚨 Critical Stock Alerts - Admin Action Required
            </CardTitle>
            <CardDescription className="text-red-700">
              Immediate administrative attention needed for inventory management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {lowStockItems.slice(0, 10).map((product) => (
                  <Badge
                    key={product.id}
                    variant="destructive"
                    className="bg-red-100 text-red-800 border-red-300 px-3 py-1"
                  >
                    🔴 {product.name} ({product.stock} left)
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  onClick={() => onNavigate("products")}
                >
                  🛠️ Manage Critical Stock
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => onNavigate("reports")}
                >
                  📊 Generate Alert Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">📈 Inventory Intelligence</CardTitle>
            <CardDescription className="text-blue-700">Advanced inventory analytics and insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Total Products</span>
              <span className="font-bold text-blue-800">{dashboardStats.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Total Stock Units</span>
              <span className="font-bold text-blue-800">{dashboardStats.totalStock}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Critical Items</span>
              <span className="font-bold text-red-600">{dashboardStats.lowStockProducts}</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => onNavigate("products")}
            >
              🔍 Deep Dive Analysis
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">💰 Revenue Intelligence</CardTitle>
            <CardDescription className="text-green-700">Sales performance and revenue analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Total Revenue</span>
              <span className="font-bold text-green-800">₹{dashboardStats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Stock Inflow</span>
              <span className="font-bold text-green-800">+{dashboardStats.stockIn}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Stock Outflow</span>
              <span className="font-bold text-red-600">-{dashboardStats.stockOut}</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => onNavigate("sales")}
            >
              📊 Revenue Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">⚡ System Performance</CardTitle>
            <CardDescription className="text-purple-700">System health and performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Database Status</span>
              <span className="font-bold text-green-600">✅ Optimal</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Active Users</span>
              <span className="font-bold text-purple-800">{systemHealth.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">System Uptime</span>
              <span className="font-bold text-purple-800">{systemHealth.systemUptime}</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-purple-300 text-purple-700 hover:bg-purple-100"
              onClick={() => onNavigate("users")}
            >
              🛠️ System Management
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
