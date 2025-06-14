"use client"

import type React from "react"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Plus, BarChart3, TrendingUp, Calendar, IndianRupee } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
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
  Legend,
} from "recharts"

interface Sale {
  id: number
  sale_code: string
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_amount: number
  customer_name: string
  created_at: string
  username: string
}

interface Product {
  id: number
  name: string
  sku: string
  price: number
  current_stock: number
}

interface ChartData {
  name: string
  value: number
  revenue: number
  count?: number
}

export default function SalesPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    customer_name: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch products and sales in parallel
      const [productsResponse, salesResponse] = await Promise.all([fetch("/api/products"), fetch("/api/sales")])

      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        // Ensure numeric fields are properly converted
        const processedProducts = productsData.map((product: any) => ({
          ...product,
          price: Number(product.price) || 0,
          current_stock: Number(product.current_stock) || 0,
        }))
        setProducts(processedProducts)
      }

      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        setSales(salesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.quantity || !formData.customer_name) {
      alert("Please fill all required fields")
      return
    }

    const selectedProduct = products.find((p) => p.id === Number(formData.product_id))
    if (!selectedProduct) return

    const quantity = Number(formData.quantity)
    const unitPrice = selectedProduct.price
    const totalAmount = unitPrice * quantity

    try {
      const saleData = {
        product_id: Number(formData.product_id),
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        customer_name: formData.customer_name,
        user_id: user?.id || 1, // Default to admin if user ID is not available
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        // Refresh data after successful submission
        await fetchData()
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || "Failed to record sale"}`)
      }
    } catch (error) {
      console.error("Error submitting sale:", error)
      alert("An error occurred while recording the sale")
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: "",
      quantity: "",
      customer_name: "",
    })
    setIsDialogOpen(false)
  }

  // Helper function to safely format price
  const formatPrice = (price: any): string => {
    const numPrice = Number(price)
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  // Calculate total sales amount
  const totalSalesAmount = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  // Prepare chart data
  const getProductSalesChart = (): ChartData[] => {
    const productSales: { [key: string]: { revenue: number; quantity: number } } = {}

    sales.forEach((sale) => {
      const productName = sale.product_name
      if (!productSales[productName]) {
        productSales[productName] = { revenue: 0, quantity: 0 }
      }
      productSales[productName].revenue += Number(sale.total_amount)
      productSales[productName].quantity += Number(sale.quantity)
    })

    return Object.entries(productSales)
      .map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        value: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8) // Top 8 products
  }

  const getMonthlySalesChart = (): ChartData[] => {
    const monthlySales: { [key: string]: { revenue: number; count: number } } = {}

    sales.forEach((sale) => {
      const date = new Date(sale.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = { revenue: 0, count: 0 }
      }
      monthlySales[monthKey].revenue += Number(sale.total_amount)
      monthlySales[monthKey].count += 1
    })

    return Object.entries(monthlySales)
      .map(([key, data]) => {
        const [year, month] = key.split("-")
        const date = new Date(Number(year), Number(month) - 1)
        return {
          name: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          value: data.revenue,
          revenue: data.revenue,
          count: data.count,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const getTopCustomersChart = (): ChartData[] => {
    const customerSales: { [key: string]: number } = {}

    sales.forEach((sale) => {
      const customer = sale.customer_name
      if (!customerSales[customer]) {
        customerSales[customer] = 0
      }
      customerSales[customer] += Number(sale.total_amount)
    })

    return Object.entries(customerSales)
      .map(([name, revenue]) => ({
        name: name.length > 12 ? name.substring(0, 12) + "..." : name,
        value: revenue,
        revenue: revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6) // Top 6 customers
  }

  const productSalesData = getProductSalesChart()
  const monthlySalesData = getMonthlySalesChart()
  const topCustomersData = getTopCustomersChart()

  // Colors for charts
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

  if (isLoading) {
    return (
      <DashboardLayout title="Sales Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Sales Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Sales Analytics & Records</h3>
            <p className="text-sm text-gray-600">Track and analyze sales performance with visual insights</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - ₹{formatPrice(product.price)} (Stock: {product.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                {formData.product_id && formData.quantity && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">
                      Total Amount: ₹
                      {formatPrice(
                        (products.find((p) => p.id === Number(formData.product_id))?.price || 0) *
                          Number(formData.quantity || "0"),
                      )}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Record Sale
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-600" />
              Sales Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">₹{formatPrice(totalSalesAmount)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{sales.length}</p>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  ₹{formatPrice(totalSalesAmount / (sales.length || 1))}
                </p>
                <p className="text-sm text-gray-600">Average Sale</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{new Set(sales.map((s) => s.customer_name)).size}</p>
                <p className="text-sm text-gray-600">Unique Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts and Data Tabs */}
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Charts
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sales History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            {/* Product Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue (₹)",
                      color: "hsl(var(--chart-1))",
                    },
                    quantity: {
                      label: "Quantity Sold",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productSalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Sales Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue (₹)",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue (₹)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue (₹)",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCustomersData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {topCustomersData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data">
            {/* Sales History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Sales History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length > 0 ? (
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDate(sale.created_at)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.product_name}</div>
                              <div className="text-sm text-gray-600">{sale.product_sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>{sale.customer_name}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell>₹{formatPrice(sale.unit_price)}</TableCell>
                          <TableCell className="font-medium">₹{formatPrice(sale.total_amount)}</TableCell>
                          <TableCell>{sale.username}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No sales recorded
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
