"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, DollarSign, ShoppingCart, TrendingUp, Calendar, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import type { Product, Sale } from "@/lib/database"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface SalesSummaryTabProps {
  onDataChange: () => void
}

// Helper functions for safe number formatting
const formatPrice = (price: any): string => {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : Number(price)
  return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
}

const formatNumber = (value: any): number => {
  const num = typeof value === "string" ? Number.parseInt(value) : Number(value)
  return isNaN(num) ? 0 : num
}

const safeNumber = (value: any): number => {
  const num = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return isNaN(num) ? 0 : num
}

// Colors for charts
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export default function SalesSummaryTab({ onDataChange }: SalesSummaryTabProps) {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    customer: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([fetch("/api/sales"), fetch("/api/products")])

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSales(salesData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: "",
      quantity: "",
      customer: "",
    })
    setError("")
  }

  const validateForm = () => {
    if (!formData.product_id) {
      setError("Please select a product")
      return false
    }
    if (!formData.quantity || Number.parseInt(formData.quantity) <= 0) {
      setError("Please enter a valid quantity")
      return false
    }
    if (!formData.customer.trim()) {
      setError("Please enter customer name")
      return false
    }

    // Check if enough stock is available
    const selectedProduct = products.find((p) => p.id === formData.product_id)
    if (selectedProduct && Number.parseInt(formData.quantity) > selectedProduct.stock) {
      setError(`Cannot sell ${formData.quantity} units. Only ${selectedProduct.stock} units available.`)
      return false
    }

    return true
  }

  const handleAddSale = async () => {
    if (!validateForm()) {
      return
    }

    const selectedProduct = products.find((p) => p.id === formData.product_id)
    if (!selectedProduct) return

    const quantity = Number.parseInt(formData.quantity) || 0
    const unitPrice = safeNumber(selectedProduct.price)
    const totalAmount = unitPrice * quantity

    try {
      setError("")

      // Create a safe user identifier
      const userIdentifier = user?.username || user?.email || user?.id || "anonymous"

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: formData.product_id,
          quantity: quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          customer: formData.customer.trim(),
          userId: userIdentifier,
        }),
      })

      if (response.ok) {
        await fetchData()
        onDataChange()
        resetForm()
        setIsAddDialogOpen(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to record sale")
      }
    } catch (error) {
      console.error("Error adding sale:", error)
      setError("Network error. Please try again.")
    }
  }

  // Calculate summary statistics with safe number handling
  const totalRevenue = sales.reduce((sum, sale) => sum + safeNumber(sale.total_amount), 0)
  const totalUnitsSold = sales.reduce((sum, sale) => sum + formatNumber(sale.quantity), 0)
  const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0

  // Get top selling products
  const productSales = sales.reduce(
    (acc, sale) => {
      if (!acc[sale.product_id]) {
        acc[sale.product_id] = {
          productName: sale.product_name || "Unknown",
          totalQuantity: 0,
          totalRevenue: 0,
        }
      }
      acc[sale.product_id].totalQuantity += formatNumber(sale.quantity)
      acc[sale.product_id].totalRevenue += safeNumber(sale.total_amount)
      return acc
    },
    {} as Record<string, { productName: string; totalQuantity: number; totalRevenue: number }>,
  )

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  // Prepare chart data
  const chartData = topProducts.map(([, data], index) => ({
    name: data.productName.length > 15 ? data.productName.substring(0, 15) + "..." : data.productName,
    revenue: data.totalRevenue,
    quantity: data.totalQuantity,
    fill: COLORS[index % COLORS.length],
  }))

  // Sales trend data (last 7 days)
  const salesTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date) => {
      const daySales = sales.filter((sale) => new Date(sale.created_at).toISOString().split("T")[0] === date)
      const dayRevenue = daySales.reduce((sum, sale) => sum + safeNumber(sale.total_amount), 0)
      const dayQuantity = daySales.reduce((sum, sale) => sum + formatNumber(sale.quantity), 0)

      return {
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        revenue: dayRevenue,
        quantity: dayQuantity,
      }
    })
  }

  const trendData = salesTrendData()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales Summary</h2>
          <p className="text-slate-600">Track sales performance and revenue</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>Add a new sale transaction to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, product_id: value })
                    setError("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => formatNumber(p.stock) > 0)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ₹{formatPrice(product.price)} (Stock: {formatNumber(product.stock)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value })
                      setError("")
                    }}
                    placeholder="0"
                    max={products.find((p) => p.id === formData.product_id)?.stock || 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="flex items-center h-10 px-3 py-2 border border-input bg-background rounded-md">
                    <span className="text-sm font-medium">
                      ₹
                      {formData.product_id && formData.quantity
                        ? (
                            safeNumber(products.find((p) => p.id === formData.product_id)?.price) *
                            (Number.parseInt(formData.quantity) || 0)
                          ).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => {
                    setFormData({ ...formData, customer: e.target.value })
                    setError("")
                  }}
                  placeholder="Enter customer name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddSale} className="bg-purple-600 hover:bg-purple-700">
                Record Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-green-600">From all sales</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{sales.length}</div>
            <p className="text-xs text-blue-600">Sales transactions</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Units Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{totalUnitsSold}</div>
            <p className="text-xs text-purple-600">Total units sold</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg. Order Value</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">₹{averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-orange-600">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {sales.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
              <CardDescription>Daily revenue and quantity sold</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue (₹)",
                    color: "hsl(var(--chart-1))",
                  },
                  quantity: {
                    label: "Quantity",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      name="Revenue (₹)"
                    />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      stroke="var(--color-quantity)"
                      strokeWidth={2}
                      name="Quantity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Products Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue (₹)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [`₹${Number(value).toFixed(2)}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Product Sales Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Distribution</CardTitle>
              <CardDescription>Revenue share by product</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue (₹)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [`₹${Number(value).toFixed(2)}`, "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quantity vs Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quantity vs Revenue</CardTitle>
              <CardDescription>Product performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity",
                    color: "hsl(var(--chart-2))",
                  },
                  revenue: {
                    label: "Revenue (₹)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="quantity" fill="var(--color-quantity)" name="Quantity" />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map(([productId, data], index) => (
                <div key={productId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{data.productName}</div>
                      <div className="text-sm text-slate-600">{data.totalQuantity} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">₹{data.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-600">Revenue</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No sales data available yet. Record your first sale to see analytics!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>All sales transactions with customer details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No sales recorded yet. Record your first sale to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-sm">
                        {new Date(sale.created_at).toLocaleDateString()}{" "}
                        {new Date(sale.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">{sale.product_name || "Unknown Product"}</TableCell>
                      <TableCell>{sale.customer || "Unknown Customer"}</TableCell>
                      <TableCell className="font-medium">{formatNumber(sale.quantity)}</TableCell>
                      <TableCell>₹{formatPrice(sale.unit_price)}</TableCell>
                      <TableCell className="font-bold text-green-600">₹{formatPrice(sale.total_amount)}</TableCell>
                      <TableCell className="text-sm text-slate-600">{sale.created_by || "System"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
