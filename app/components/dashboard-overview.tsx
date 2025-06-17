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
  Plus,
  ShoppingCart,
  BarChart3,
  AlertCircle,
  Zap,
} from "lucide-react"
import type { Product } from "@/lib/database"

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
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

  useEffect(() => {
    fetchDashboardData()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-slate-600">Loading dashboard...</span>
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
      {/* Welcome Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl">
            <div className="relative">
              <Package2 className="h-12 w-12 text-white" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Welcome to SmartStock</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Your intelligent inventory management system. Streamline operations, track stock movements, monitor sales, and
          analyze performance with smart automation.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("products")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
            <Package2 className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalProducts}</div>
            <p className="text-xs opacity-90">Click to manage products</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("stock")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStock}</div>
            <p className="text-xs opacity-90">Click to view movements</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("products")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.lowStockProducts}</div>
            <p className="text-xs opacity-90">Products need restocking</p>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate("sales")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Sales Revenue</CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboardStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs opacity-90">Click to view sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Smart Actions
          </CardTitle>
          <CardDescription>Get started with your intelligent inventory management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="h-20 flex flex-col gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={() => onNavigate("products")}
            >
              <Package2 className="h-6 w-6" />
              <span>Add Products</span>
            </Button>
            <Button
              className="h-20 flex flex-col gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              onClick={() => onNavigate("stock")}
            >
              <BarChart3 className="h-6 w-6" />
              <span>Stock Movement</span>
            </Button>
            <Button
              className="h-20 flex flex-col gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              onClick={() => onNavigate("sales")}
            >
              <ShoppingCart className="h-6 w-6" />
              <span>Record Sale</span>
            </Button>
            <Button
              className="h-20 flex flex-col gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              onClick={() => onNavigate("reports")}
            >
              <TrendingUp className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      {dashboardStats.totalProducts === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Zap className="h-5 w-5" />🚀 Getting Started with SmartStock
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your inventory is empty. Follow these smart steps to get started:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-semibold text-blue-800">Add Products</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Start by adding your first products to the smart inventory system.
                </p>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => onNavigate("products")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold text-blue-800">Track Stock</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">Monitor stock levels and record movements intelligently.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => onNavigate("stock")}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  View Stock
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold text-blue-800">Record Sales</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">Start recording sales and track your revenue smartly.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  onClick={() => onNavigate("sales")}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Record Sale
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts - Only show if there are products */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Smart Stock Alerts
            </CardTitle>
            <CardDescription className="text-orange-700">
              SmartStock detected these products need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {lowStockItems.slice(0, 10).map((product) => (
                <Badge
                  key={product.id}
                  variant="destructive"
                  className="bg-orange-100 text-orange-800 border-orange-300"
                >
                  {product.name} ({product.stock} left)
                </Badge>
              ))}
            </div>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              onClick={() => onNavigate("products")}
            >
              Manage Products
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Summary - Only show if there's data */}
      {dashboardStats.totalProducts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
              <CardDescription>Current smart inventory status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Products</span>
                <span className="font-semibold">{dashboardStats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Stock Units</span>
                <span className="font-semibold">{dashboardStats.totalStock}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Low Stock Items</span>
                <span className="font-semibold text-orange-600">{dashboardStats.lowStockProducts}</span>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate("products")}>
                View All Products
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Revenue and sales performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Revenue</span>
                <span className="font-semibold text-green-600">₹{dashboardStats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Stock In</span>
                <span className="font-semibold text-blue-600">+{dashboardStats.stockIn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Stock Out</span>
                <span className="font-semibold text-red-600">-{dashboardStats.stockOut}</span>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate("sales")}>
                View Sales Details
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
