"use client"

import type React from "react"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, AlertTriangle, Download, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { generateStockReportPDF, generateProductDetailPDF } from "@/lib/pdf-generator"

interface Product {
  id: number
  product_code: string
  name: string
  description: string
  sku: string
  price: number
  current_stock: number
  min_stock_level: number
  category: string
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    current_stock: "",
    min_stock_level: "",
    category: "",
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        // Ensure numeric fields are properly converted
        const processedData = data.map((product: any) => ({
          ...product,
          price: Number(product.price) || 0,
          current_stock: Number(product.current_stock) || 0,
          min_stock_level: Number(product.min_stock_level) || 0,
        }))
        setProducts(processedData)
      } else {
        console.error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const errors: { [key: string]: string } = {}
    if (!formData.name) errors.name = "Product Name is required"
    if (!formData.sku) errors.sku = "SKU is required"
    if (!formData.price) errors.price = "Price is required"
    if (!formData.current_stock) errors.current_stock = "Current Stock is required"
    if (!formData.min_stock_level) errors.min_stock_level = "Min Stock Level is required"
    if (!formData.category) errors.category = "Category is required"

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const productData = {
      name: formData.name,
      description: formData.description,
      sku: formData.sku,
      price: Number.parseFloat(formData.price),
      current_stock: Number.parseInt(formData.current_stock),
      min_stock_level: Number.parseInt(formData.min_stock_level),
      category: formData.category,
    }

    try {
      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })
        if (response.ok) {
          await fetchProducts()
        }
      } else {
        // Add new product
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })
        if (response.ok) {
          await fetchProducts()
        }
      }
      resetForm()
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      price: "",
      current_stock: "",
      min_stock_level: "",
      category: "",
    })
    setEditingProduct(null)
    setIsDialogOpen(false)
    setFormErrors({})
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: Number(product.price).toString(),
      current_stock: Number(product.current_stock).toString(),
      min_stock_level: Number(product.min_stock_level).toString(),
      category: product.category,
    })
    setIsDialogOpen(true)
    setFormErrors({})
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          await fetchProducts()
        }
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  const isLowStock = (product: Product) => {
    return Number(product.current_stock) <= Number(product.min_stock_level)
  }

  const handleGenerateStockReport = () => {
    const reportData = {
      products: products.map((p) => ({
        product_code: p.product_code,
        name: p.name,
        sku: p.sku,
        category: p.category,
        current_stock: Number(p.current_stock),
        min_stock_level: Number(p.min_stock_level),
        price: Number(p.price),
      })),
      reportDate: new Date().toLocaleString(),
      reportId: `RPT${Date.now().toString().slice(-6)}`,
    }
    generateStockReportPDF(reportData)
  }

  const handleGenerateProductPDF = (product: Product) => {
    const productData = {
      ...product,
      price: Number(product.price),
      current_stock: Number(product.current_stock),
      min_stock_level: Number(product.min_stock_level),
    }
    generateProductDetailPDF(productData)
  }

  // Helper function to safely format price
  const formatPrice = (price: any): string => {
    const numPrice = Number(price)
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  // Helper function to safely format numbers
  const formatNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Products">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Products">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-blue-600">Product Inventory</h3>
            <p className="text-gray-600 mt-1">Manage your product catalog with unique tracking codes</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateStockReport}
              className="hover:bg-green-50 hover:border-green-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF Report
            </Button>
            {user?.role === "admin" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                      {formErrors.sku && <p className="text-red-500 text-sm">{formErrors.sku}</p>}
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                        {formErrors.price && <p className="text-red-500 text-sm">{formErrors.price}</p>}
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                        />
                        {formErrors.category && <p className="text-red-500 text-sm">{formErrors.category}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentStock">Current Stock</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          value={formData.current_stock}
                          onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                          required
                        />
                        {formErrors.current_stock && <p className="text-red-500 text-sm">{formErrors.current_stock}</p>}
                      </div>
                      <div>
                        <Label htmlFor="minStockLevel">Min Stock Level</Label>
                        <Input
                          id="minStockLevel"
                          type="number"
                          value={formData.min_stock_level}
                          onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                          required
                        />
                        {formErrors.min_stock_level && (
                          <p className="text-red-500 text-sm">{formErrors.min_stock_level}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingProduct ? "Update" : "Add"} Product
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-mono">
                        {product.product_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>₹{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatNumber(product.current_stock)}
                        {isLowStock(product) && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isLowStock(product) ? "destructive" : "default"}>
                        {isLowStock(product) ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateProductPDF(product)}
                          className="hover:bg-green-50 hover:border-green-200"
                          title="Generate PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {user?.role === "admin" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                              className="hover:bg-blue-50 hover:border-blue-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(product.id)}
                              className="hover:bg-red-50 hover:border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
