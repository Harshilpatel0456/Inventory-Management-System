"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Package, DollarSign, Calendar, BarChart3, Download } from "lucide-react"
import type { Product, Sale, StockMovement } from "@/lib/database"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Add these helper functions at the top of the file
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

export default function ReportsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [reportType, setReportType] = useState("inventory")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      const [productsRes, salesRes, stockRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
        fetch("/api/stock-movements"),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSales(salesData)
      }

      if (stockRes.ok) {
        const stockData = await stockRes.json()
        setStockMovements(stockData)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate inventory metrics
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + safeNumber(product.price) * formatNumber(product.stock),
    0,
  )
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock)
  const outOfStockProducts = products.filter((p) => p.stock === 0)

  // Calculate sales metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + safeNumber(sale.total_amount), 0)
  const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0

  // Top selling products
  const productSales = sales.reduce(
    (acc, sale) => {
      if (!acc[sale.product_id]) {
        acc[sale.product_id] = {
          productName: sale.product_name || "Unknown",
          totalQuantity: 0,
          totalRevenue: 0,
        }
      }
      acc[sale.product_id].totalQuantity += sale.quantity
      acc[sale.product_id].totalRevenue += sale.total_amount
      return acc
    },
    {} as Record<string, { productName: string; totalQuantity: number; totalRevenue: number }>,
  )

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)

  // Stock movement analysis
  const stockIn = stockMovements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0)
  const stockOut = stockMovements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0)

  const generatePDFReport = async (title: string, content: string) => {
    try {
      // Create a comprehensive HTML structure for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
              @page {
                margin: 15mm;
                size: A4;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.4;
                color: #1e293b;
                background: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 25px;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                border-radius: 15px;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .subtitle {
                font-size: 16px;
                opacity: 0.9;
              }
              .report-title {
                font-size: 28px;
                font-weight: bold;
                margin: 25px 0;
                color: #1e293b;
                text-align: center;
              }
              .summary-section {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                padding: 25px;
                border-radius: 15px;
                margin: 25px 0;
                border-left: 6px solid #3b82f6;
              }
              .summary-title {
                font-size: 20px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 20px;
                text-align: center;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
              }
              .summary-card {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border: 2px solid #e2e8f0;
              }
              .summary-label {
                font-size: 12px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
                font-weight: 600;
              }
              .summary-value {
                font-size: 28px;
                font-weight: bold;
                color: #1e293b;
              }
              .summary-value.green { color: #059669; }
              .summary-value.orange { color: #d97706; }
              .summary-value.red { color: #dc2626; }
              .summary-value.blue { color: #2563eb; }
              .summary-value.purple { color: #7c3aed; }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 30px 0;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
              }
              th, td { 
                padding: 15px 10px; 
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
                font-size: 12px;
              }
              th { 
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                font-size: 11px;
              }
              tr:nth-child(even) { 
                background-color: #f8fafc; 
              }
              tr:hover {
                background-color: #e2e8f0;
              }
              .status-badge {
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .status-in-stock { 
                background: #dcfce7; 
                color: #166534; 
              }
              .status-low-stock { 
                background: #fed7aa; 
                color: #9a3412; 
              }
              .status-out-of-stock { 
                background: #fecaca; 
                color: #991b1b; 
              }
              .footer {
                margin-top: 50px;
                padding: 25px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
                border-top: 3px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 10px;
              }
              .category-badge {
                background: #e0e7ff;
                color: #3730a3;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 600;
              }
              .rank-badge {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: #92400e;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
              }
              .movement-in {
                color: #059669;
                font-weight: bold;
              }
              .movement-out {
                color: #dc2626;
                font-weight: bold;
              }
              @media print {
                body { print-color-adjust: exact; }
                .header { break-inside: avoid; }
                table { break-inside: avoid; }
                tr { break-inside: avoid; }
                .summary-section { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">📦 SmartStock</div>
              <div class="subtitle">Smart Inventory Management System</div>
            </div>
            ${content}
            <div class="footer">
              <p><strong>SmartStock - Smart Inventory Management System</strong></p>
              <p>Professional Business Intelligence Report</p>
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>© 2024 SmartStock. All rights reserved.</p>
            </div>
          </body>
        </html>
      `

      // Create blob and trigger download
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)

      // Create a temporary link to download
      const link = document.createElement("a")
      link.href = url
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Open in new window for PDF printing
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Wait for content to load then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
          }, 1000)
        }
      }

      // Show success message
      alert(
        "📄 PDF Report Generated Successfully!\n\n✅ The report has opened in a new window\n✅ Print dialog will appear automatically\n✅ Select 'Save as PDF' to download\n\nTip: Use landscape orientation for better table formatting!",
      )
    } catch (error) {
      console.error("Error generating PDF report:", error)
      alert("❌ Error generating PDF report. Please try again.")
    }
  }

  const exportInventoryReportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" })

    doc.setFontSize(18)
    doc.text("SmartStock Inventory Report", 40, 40)

    // Summary
    doc.setFontSize(12)
    doc.text(`Total Products: ${products.length}`, 40, 65)
    doc.text(`Inventory Value: ₹${formatPrice(totalInventoryValue)}`, 200, 65)
    doc.text(`\t\tLow Stock Items: ${lowStockProducts.length}`, 400, 65)
    doc.text(`\tOut of Stock: ${outOfStockProducts.length}`, 550, 65)

    // Table
    const headers = [
      [
        "Product Name",
        "SKU",
        "Category",
        "Current Stock",
        "Min Stock",
        "Unit Price",
        "Total Value",
        "Supplier",
        "Status",
      ],
    ]

    const rows = products.map((product) => {
      const stock = formatNumber(product.stock)
      const minStock = formatNumber(product.min_stock)
      const unitPrice = safeNumber(product.price)
      const totalValue = unitPrice * stock
      let statusText = "In Stock"
      if (stock === 0) statusText = "Out of Stock"
      else if (stock <= minStock) statusText = "Low Stock"
      return [
        product.name || "Unnamed Product",
        product.sku || "N/A",
        product.category || "Uncategorized",
        stock.toString(),
        minStock.toString(),
        `₹${formatPrice(unitPrice)}`,
        `₹${formatPrice(totalValue)}`,
        product.supplier || "No supplier",
        statusText,
      ]
    })

    autoTable(doc, {
      startY: 90,
      head: headers,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 8) {
          // Status column
          if (data.cell.raw === "In Stock") {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [22, 101, 52]
          } else if (data.cell.raw === "Low Stock") {
            data.cell.styles.fillColor = [254, 215, 170]
            data.cell.styles.textColor = [154, 52, 18]
          } else if (data.cell.raw === "Out of Stock") {
            data.cell.styles.fillColor = [254, 202, 202]
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    doc.setFontSize(10)
    doc.text(
      `Report generated on ${new Date().toLocaleString()}`,
      40,
      doc.internal.pageSize.getHeight() - 30,
    )

    doc.save(`smartstock-inventory-report-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const exportSalesReportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" })

    doc.setFontSize(18)
    doc.text("SmartStock Sales Report", 40, 40)

    // Summary
    doc.setFontSize(12)
    doc.text(`Total Revenue: ₹${formatPrice(totalRevenue)}`, 40, 65)
    doc.text(`Units Sold: ${totalUnitsSold}`, 200, 65)
    doc.text(`Total Orders: ${sales.length}`, 400, 65)
    doc.text(`Avg Order Value: ₹${formatPrice(averageOrderValue)}`, 550, 65)

    // Table
    const headers = [
      [
        "Rank",
        "Product Name",
        "Units Sold",
        "Total Revenue",
        "Avg Price",
        "Performance",
      ],
    ]

    const rows = topProducts.map(([, data], index) => {
      const avgPrice = data.totalRevenue / data.totalQuantity
      const performance = index < 3 ? "Excellent" : index < 6 ? "Good" : "Average"
      return [
        `#${index + 1}`,
        data.productName,
        data.totalQuantity,
        `₹${formatPrice(data.totalRevenue)}`,
        `₹${formatPrice(avgPrice)}`,
        performance,
      ]
    })

    autoTable(doc, {
      startY: 90,
      head: headers,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 5) {
          // Performance column
          if (data.cell.raw === "Excellent") {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [22, 101, 52]
          } else if (data.cell.raw === "Good") {
            data.cell.styles.fillColor = [254, 215, 170]
            data.cell.styles.textColor = [154, 52, 18]
          } else if (data.cell.raw === "Average") {
            data.cell.styles.fillColor = [226, 232, 240]
            data.cell.styles.textColor = [71, 85, 105]
          }
        }
      },
    })

    doc.setFontSize(10)
    doc.text(
      `Report generated on ${new Date().toLocaleString()}`,
      40,
      doc.internal.pageSize.getHeight() - 30,
    )

    doc.save(`smartstock-sales-report-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const exportStockMovementsReportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" })

    doc.setFontSize(18)
    doc.text("SmartStock Stock Movements Report", 40, 40)

    // Summary
    doc.setFontSize(12)
    doc.text(`Stock In: +${stockIn}`, 40, 65)
    doc.text(`Stock Out: -${stockOut}`, 200, 65)
    doc.text(`Net Movement: ${stockIn - stockOut >= 0 ? "+" : ""}${stockIn - stockOut}`, 400, 65)
    doc.text(`Total Movements: ${stockMovements.length}`, 550, 65)

    // Table
    const headers = [
      [
        "Date & Time",
        "Product",
        "Movement Type",
        "Quantity",
        "Reason",
        "Notes",
        "Created By",
      ],
    ]

    const rows = stockMovements.slice(0, 50).map((movement) => {
      const isStockIn = movement.type === "in"
      const typeText = isStockIn ? "Stock In" : "Stock Out"
      const quantityPrefix = isStockIn ? "+" : "-"
      return [
        new Date(movement.created_at).toLocaleString(),
        movement.product_name || "Unknown",
        typeText,
        `${quantityPrefix}${movement.quantity}`,
        movement.reason,
        movement.notes || "-",
        movement.created_by || "System",
      ]
    })

    autoTable(doc, {
      startY: 90,
      head: headers,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 2) {
          // Movement Type column
          if (data.cell.raw === "Stock In") {
            data.cell.styles.fillColor = [220, 252, 231]
            data.cell.styles.textColor = [22, 101, 52]
          } else if (data.cell.raw === "Stock Out") {
            data.cell.styles.fillColor = [254, 202, 202]
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    doc.setFontSize(10)
    doc.text(
      `Report generated on ${new Date().toLocaleString()}`,
      40,
      doc.internal.pageSize.getHeight() - 30,
    )

    doc.save(`smartstock-stock-movements-report-${new Date().toISOString().split("T")[0]}.pdf`)
  }

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
          <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-slate-600">Comprehensive insights into your inventory and sales</p>
        </div>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inventory">Inventory Report</SelectItem>
            <SelectItem value="sales">Sales Report</SelectItem>
            <SelectItem value="movements">Stock Movements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Report */}
      {reportType === "inventory" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">₹{formatPrice(totalInventoryValue)}</div>
                <p className="text-xs text-blue-600">Total stock value</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">In Stock</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {products.filter((p) => p.stock > p.min_stock).length}
                </div>
                <p className="text-xs text-green-600">Products well stocked</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Low Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{lowStockProducts.length}</div>
                <p className="text-xs text-orange-600">Need restocking</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Out of Stock</CardTitle>
                <Package className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{outOfStockProducts.length}</div>
                <p className="text-xs text-red-600">Urgent restocking</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={exportInventoryReportToPDF} className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="h-4 w-4 mr-2" />📄 Export PDF Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status by Product</CardTitle>
              <CardDescription>Current stock levels and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{product.min_stock}</TableCell>
                        <TableCell>₹{formatPrice(safeNumber(product.price) * formatNumber(product.stock))}</TableCell>
                        <TableCell>
                          {product.stock > product.min_stock ? (
                            <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                          ) : product.stock > 0 ? (
                            <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>
                          ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Report */}
      {reportType === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">₹{formatPrice(totalRevenue)}</div>
                <p className="text-xs text-green-600">All time sales</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Units Sold</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalUnitsSold}</div>
                <p className="text-xs text-blue-600">Total units</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">₹{formatPrice(averageOrderValue)}</div>
                <p className="text-xs text-purple-600">Per transaction</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Total Orders</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{sales.length}</div>
                <p className="text-xs text-orange-600">Sales transactions</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={exportSalesReportToPDF} className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="h-4 w-4 mr-2" />📄 Export PDF Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map(([productId, data], index) => (
                      <TableRow key={productId}>
                        <TableCell>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{data.productName}</TableCell>
                        <TableCell>{data.totalQuantity}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{formatPrice(data.totalRevenue)}</TableCell>
                        <TableCell>₹{formatPrice(data.totalRevenue / data.totalQuantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Movements Report */}
      {reportType === "movements" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Stock In</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">+{stockIn}</div>
                <p className="text-xs text-green-600">Units added</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Stock Out</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">-{stockOut}</div>
                <p className="text-xs text-red-600">Units removed</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Net Movement</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{stockIn - stockOut}</div>
                <p className="text-xs text-blue-600">Net change</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={exportStockMovementsReportToPDF} className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="h-4 w-4 mr-2" />📄 Export PDF Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Latest inventory changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.slice(0, 20).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">{new Date(movement.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{movement.product_name}</TableCell>
                        <TableCell>
                          {movement.type === "in" ? (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              In
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Out
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className={movement.type === "in" ? "text-green-600" : "text-red-600"}>
                            {movement.type === "in" ? "+" : "-"}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
