"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: number
  name: string
  current_stock: number
  min_stock_level: number
  price: number
}

interface Sale {
  product_name: string
  quantity: number
  total_amount: number
}

interface MonthlySales {
  month: string
  sales: number
  revenue: number
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch products and sales
      const [productsResponse, salesResponse] = await Promise.all([fetch("/api/products"), fetch("/api/sales")])

      if (productsResponse.ok && salesResponse.ok) {
        const productsData = await productsResponse.json()
        const salesData = await salesResponse.json()

        // Process products data
        const processedProducts = productsData.map((product: any) => ({
          id: product.id,
          name: product.name,
          current_stock: Number(product.current_stock) || 0,
          min_stock_level: Number(product.min_stock_level) || 0,
          price: Number(product.price) || 0,
        }))
        setProducts(processedProducts)

        // Process sales data
        setSales(salesData)

        // Generate monthly sales report
        generateMonthlySalesReport(salesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMonthlySalesReport = (salesData: any[]) => {
    const monthlyData: { [key: string]: { sales: number; revenue: number } } = {}

    salesData.forEach((sale) => {
      const date = new Date(sale.created_at)
      const monthYear = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { sales: 0, revenue: 0 }
      }

      monthlyData[monthYear].sales += Number(sale.quantity)
      monthlyData[monthYear].revenue += Number(sale.total_amount)
    })

    // Convert to array and sort by date (most recent first)
    const monthlyReport = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      sales: data.sales,
      revenue: data.revenue,
    }))

    // Sort by most recent month (assuming format "Month Year")
    monthlyReport.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ")
      const [bMonth, bYear] = b.month.split(" ")

      if (aYear !== bYear) return Number(bYear) - Number(aYear)

      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]
      return months.indexOf(bMonth) - months.indexOf(aMonth)
    })

    setMonthlySales(monthlyReport)
  }

  // Helper function to safely format price
  const formatPrice = (price: any): string => {
    const numPrice = Number(price)
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  // Calculate product sales performance
  const getProductSalesPerformance = () => {
    const productSales: { [key: number]: { productName: string; totalSold: number; revenue: number } } = {}

    // Initialize with all products (including those with no sales)
    products.forEach((product) => {
      productSales[product.id] = {
        productName: product.name,
        totalSold: 0,
        revenue: 0,
      }
    })

    // Add sales data
    sales.forEach((sale: any) => {
      if (productSales[sale.product_id]) {
        productSales[sale.product_id].totalSold += Number(sale.quantity)
        productSales[sale.product_id].revenue += Number(sale.total_amount)
      }
    })

    return Object.values(productSales)
  }

  // Get low stock products
  const getLowStockProducts = () => {
    return products.filter((product) => product.current_stock <= product.min_stock_level)
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const productSalesPerformance = getProductSalesPerformance()
  const lowStockProducts = getLowStockProducts()

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Business Reports</h3>
          <p className="text-sm text-gray-600">Analyze your inventory and sales performance</p>
        </div>

        {/* Product Sales Report */}
        <Card>
          <CardHeader>
            <CardTitle>Product Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Units Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSalesPerformance.length > 0 ? (
                  productSalesPerformance.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell>{product.totalSold}</TableCell>
                      <TableCell>₹{formatPrice(product.revenue)}</TableCell>
                      <TableCell>
                        <Badge variant={product.totalSold > 0 ? "default" : "secondary"}>
                          {product.totalSold > 0 ? "Active" : "No Sales"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No product sales data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alert Report */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert Report</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Level</TableHead>
                    <TableHead>Action Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.current_stock}</TableCell>
                      <TableCell>{product.min_stock_level}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Restock Needed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-600 py-4">All products are adequately stocked!</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySales.length > 0 ? (
                  monthlySales.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell>{month.sales}</TableCell>
                      <TableCell>₹{formatPrice(month.revenue)}</TableCell>
                      <TableCell>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Current" : "Previous"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No monthly sales data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
