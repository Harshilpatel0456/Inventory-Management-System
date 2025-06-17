"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import LoginForm from "@/components/login-form"
import Sidebar from "@/components/sidebar"
import DashboardOverview from "./components/dashboard-overview"
import AdminDashboard from "./components/admin-dashboard"
import ProductsTab from "./components/products-tab"
import StockMovementsTab from "./components/stock-movements-tab"
import SalesSummaryTab from "./components/sales-summary-tab"
import ReportsTab from "./components/reports-tab"
import type { Product } from "@/lib/database"
import UserManagementTab from "./components/user-management-tab"

function InventoryDashboard() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    stockIn: 0,
    stockOut: 0,
  })
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, productsResponse] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/products"),
      ])

      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setDashboardStats(stats)
      }

      if (productsResponse.ok) {
        const products = await productsResponse.json()
        const lowStock = products.filter((p: Product) => p.stock <= p.min_stock)
        setLowStockItems(lowStock)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  const getPageTitle = () => {
    if (user?.role === "admin") {
      switch (activeTab) {
        case "dashboard":
          return "Admin Control Center"
        case "products":
          return "Advanced Product Management"
        case "stock":
          return "Stock Analytics & Control"
        case "sales":
          return "Sales Intelligence Dashboard"
        case "reports":
          return "Advanced Reports & Analytics"
        case "users":
          return "User Management Console"
        default:
          return "Admin Dashboard"
      }
    } else {
      switch (activeTab) {
        case "dashboard":
          return "Dashboard Overview"
        case "products":
          return "Product Management"
        case "stock":
          return "Stock Movements"
        case "sales":
          return "Sales Summary"
        case "reports":
          return "Reports & Analytics"
        default:
          return "Dashboard"
      }
    }
  }

  const getPageDescription = () => {
    if (user?.role === "admin") {
      switch (activeTab) {
        case "dashboard":
          return "Advanced administrative control center with system monitoring"
        case "products":
          return "Comprehensive product management with advanced analytics"
        case "stock":
          return "Real-time stock analytics and movement intelligence"
        case "sales":
          return "Advanced sales performance and revenue analytics"
        case "reports":
          return "Comprehensive business intelligence and reporting"
        case "users":
          return "Complete user management and access control"
        default:
          return "Advanced inventory management system"
      }
    } else {
      switch (activeTab) {
        case "dashboard":
          return "Overview of your inventory management system"
        case "products":
          return "Manage your inventory products and stock levels"
        case "stock":
          return "Track all stock in and out movements"
        case "sales":
          return "Monitor sales performance and revenue"
        case "reports":
          return "Analyze your inventory and sales data"
        default:
          return "Inventory management system"
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading SmartStock...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 lg:ml-0">
        <div className="container mx-auto p-6 lg:pl-8">
          {/* Header - Only show for non-dashboard pages */}
          {activeTab !== "dashboard" && (
            <>
              <div className="mb-8 mt-12 lg:mt-0">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">{getPageTitle()}</h1>
                <p className="text-slate-600">{getPageDescription()}</p>
                {user?.role === "admin" && (
                  <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    👑 Administrator Access
                  </Badge>
                )}
              </div>

              {/* Dashboard Stats - Show on all non-dashboard tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                  className={`${
                    user?.role === "admin"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600"
                      : "bg-gradient-to-r from-blue-500 to-blue-600"
                  } text-white border-0`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
                    <Package className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalProducts}</div>
                    <p className="text-xs opacity-90">
                      {user?.role === "admin" ? "📊 Advanced Management" : "Active products in inventory"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">Total Stock</CardTitle>
                    <TrendingUp className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalStock}</div>
                    <p className="text-xs opacity-90">
                      {user?.role === "admin" ? "🔄 Real-time Tracking" : "Units in stock"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">
                      {user?.role === "admin" ? "Critical Alerts" : "Low Stock Alert"}
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.lowStockProducts}</div>
                    <p className="text-xs opacity-90">
                      {user?.role === "admin" ? "⚠️ Immediate Action Required" : "Products need restocking"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">
                      {user?.role === "admin" ? "Revenue Analytics" : "Sales Revenue"}
                    </CardTitle>
                    <DollarSign className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{dashboardStats.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs opacity-90">
                      {user?.role === "admin" ? "💰 Advanced Insights" : "Total sales value"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Alerts */}
              {lowStockItems.length > 0 && (
                <Card className="mb-8 border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      {user?.role === "admin" ? "🚨 Critical Stock Alerts - Admin Action Required" : "Low Stock Alerts"}
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      {user?.role === "admin"
                        ? "Immediate administrative attention needed for inventory management"
                        : "Products that need immediate attention"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lowStockItems.map((product) => (
                        <Badge
                          key={product.id}
                          variant="destructive"
                          className="bg-orange-100 text-orange-800 border-orange-300"
                        >
                          {user?.role === "admin" ? "🔴" : ""} {product.name} ({product.stock} left)
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Tab Content */}
          {activeTab === "dashboard" ? (
            user?.role === "admin" ? (
              <AdminDashboard onNavigate={setActiveTab} />
            ) : (
              <DashboardOverview onNavigate={setActiveTab} />
            )
          ) : (
            <Card className="border-0 shadow-xl">
              {activeTab === "products" && <ProductsTab onDataChange={fetchDashboardData} />}
              {activeTab === "stock" && <StockMovementsTab onDataChange={fetchDashboardData} />}
              {activeTab === "sales" && <SalesSummaryTab onDataChange={fetchDashboardData} />}
              {activeTab === "reports" && <ReportsTab />}
              {activeTab === "users" && <UserManagementTab />}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InventoryManagement() {
  return (
    <AuthProvider>
      <InventoryDashboard />
    </AuthProvider>
  )
}
