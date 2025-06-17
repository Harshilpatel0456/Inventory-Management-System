"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, AlertTriangle, Download } from "lucide-react"
import type { Product } from "@/lib/database"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ProductsTabProps {
  onDataChange: () => void
}

// Helper function to safely convert to number and format
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

export default function ProductsTab({ onDataChange }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    min_stock: "",
    description: "",
    supplier: "",
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          price: Number.parseFloat(formData.price) || 0,
          stock: Number.parseInt(formData.stock) || 0,
          min_stock: Number.parseInt(formData.min_stock) || 0,
          description: formData.description,
          supplier: formData.supplier,
        }),
      })

      if (response.ok) {
        await fetchProducts()
        onDataChange()
        resetForm()
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          price: Number.parseFloat(formData.price) || 0,
          stock: Number.parseInt(formData.stock) || 0,
          min_stock: Number.parseInt(formData.min_stock) || 0,
          description: formData.description,
          supplier: formData.supplier,
        }),
      })

      if (response.ok) {
        await fetchProducts()
        onDataChange()
        resetForm()
        setIsEditDialogOpen(false)
        setEditingProduct(null)
      }
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchProducts()
        onDataChange()
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
      min_stock: "",
      description: "",
      supplier: "",
    })
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      price: formatPrice(product.price),
      stock: formatNumber(product.stock).toString(),
      min_stock: formatNumber(product.min_stock).toString(),
      description: product.description || "",
      supplier: product.supplier || "",
    })
    setIsEditDialogOpen(true)
  }

  const exportProductsToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    })

    // Title
    doc.setFontSize(18)
    doc.text("SmartStock Products Report", 40, 40)

    // Summary
    const totalInventoryValue = filteredProducts.reduce(
      (sum, product) => sum + safeNumber(product.price) * formatNumber(product.stock),
      0,
    )
    const lowStockCount = filteredProducts.filter((p) => formatNumber(p.stock) <= formatNumber(p.min_stock) && formatNumber(p.stock) > 0).length
    const outOfStockCount = filteredProducts.filter((p) => formatNumber(p.stock) === 0).length

    doc.setFontSize(12)
    doc.text(`Total Products: ${filteredProducts.length}`, 40, 65)
    doc.text(`Inventory Value: ₹${formatPrice(totalInventoryValue)}`, 200, 65)
    doc.text(`\t\tLow Stock Items: ${lowStockCount}`, 400, 65)
    doc.text(`\tOut of Stock: ${outOfStockCount}`, 550, 65)

    // Table headers and rows
    const headers = [
      [
        "Product Name",
        "SKU",
        "Category",
        "Price",
        "Stock",
        "Min Stock",
        "Total Value",
        "Supplier",
        "Status",
      ],
    ]

    const rows = filteredProducts.map((product) => {
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
        `₹${formatPrice(unitPrice)}`,
        stock.toString(),
        minStock.toString(),
        `₹${formatPrice(totalValue)}`,
        product.supplier || "No supplier",
        statusText,
      ]
    })

    // Add table with colored rows based on status
    autoTable(doc, {
      startY: 90,
      head: headers,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' }, // blue header
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 8) {
          // Status column
          if (data.cell.raw === "In Stock") {
            data.cell.styles.fillColor = [220, 252, 231]; // green
            data.cell.styles.textColor = [22, 101, 52];
          } else if (data.cell.raw === "Low Stock") {
            data.cell.styles.fillColor = [254, 215, 170]; // orange
            data.cell.styles.textColor = [154, 52, 18];
          } else if (data.cell.raw === "Out of Stock") {
            data.cell.styles.fillColor = [254, 202, 202]; // red
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    // Footer
    doc.setFontSize(10)
    doc.text(
      `Report generated on ${new Date().toLocaleString()}`,
      40,
      doc.internal.pageSize.getHeight() - 30,
    )

    doc.save(`smartstock-products-report-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const filteredProducts = products.filter(
    (product) =>
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
          <h2 className="text-2xl font-bold text-slate-800">Product Management</h2>
          <p className="text-slate-600">Add, edit, and manage your inventory products</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportProductsToPDF}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            <Download className="h-4 w-4 mr-2" />📄 Export PDF
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Enter the details for the new product below.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter SKU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Minimum Stock</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search products by name, SKU, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>Manage your product inventory and stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No products found. Add your first product to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name || "Unnamed Product"}</div>
                          <div className="text-sm text-slate-500">{product.supplier || "No supplier"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">₹{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatNumber(product.stock)}</span>
                          {formatNumber(product.stock) <= formatNumber(product.min_stock) && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatNumber(product.stock) > formatNumber(product.min_stock) ? (
                          <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                        ) : formatNumber(product.stock) > 0 ? (
                          <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details below.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Current Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minStock">Minimum Stock</Label>
              <Input
                id="edit-minStock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-supplier">Supplier</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} className="bg-blue-600 hover:bg-blue-700">
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
