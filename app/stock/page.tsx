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
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface StockMovement {
  id: number
  movement_code: string
  product_id: number
  product_name: string
  product_sku: string
  movement_type: "in" | "out"
  quantity: number
  reason: string
  created_at: string
  username: string
}

interface Product {
  id: number
  product_code: string
  name: string
  sku: string
  current_stock: number
  min_stock_level: number
}

export default function StockPage() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "",
    quantity: "",
    reason: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch products and stock movements in parallel
      const [productsResponse, movementsResponse] = await Promise.all([fetch("/api/products"), fetch("/api/stock")])

      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        // Ensure numeric fields are properly converted
        const processedProducts = productsData.map((product: any) => ({
          ...product,
          current_stock: Number(product.current_stock) || 0,
          min_stock_level: Number(product.min_stock_level) || 0,
        }))
        setProducts(processedProducts)
      }

      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json()
        setMovements(movementsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.movement_type || !formData.quantity) {
      alert("Please fill all required fields")
      return
    }

    try {
      const movementData = {
        product_id: Number(formData.product_id),
        movement_type: formData.movement_type as "in" | "out",
        quantity: Number(formData.quantity),
        reason: formData.reason,
        user_id: user?.id || 1, // Default to admin if user ID is not available
      }

      const response = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(movementData),
      })

      if (response.ok) {
        // Refresh data after successful submission
        await fetchData()
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || "Failed to record movement"}`)
      }
    } catch (error) {
      console.error("Error submitting stock movement:", error)
      alert("An error occurred while recording the movement")
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: "",
      movement_type: "",
      quantity: "",
      reason: "",
    })
    setIsDialogOpen(false)
  }

  const isLowStock = (product: Product) => {
    return Number(product.current_stock) <= Number(product.min_stock_level)
  }

  // Helper function to safely format numbers
  const formatNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Stock Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Stock Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Stock Movements</h3>
            <p className="text-sm text-gray-600">Track inventory in and out movements</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Movement</DialogTitle>
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
                          {product.name} ({product.sku}) - Stock: {formatNumber(product.current_stock)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="movementType">Movement Type</Label>
                  <Select
                    value={formData.movement_type}
                    onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
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
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Sale, Purchase, Return, Damage"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Record Movement
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Current Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{formatNumber(product.current_stock)} units</Badge>
                          {isLowStock(product) && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLowStock(product) ? "destructive" : "default"}>
                          {isLowStock(product) ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stock Movement History */}
        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length > 0 ? (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{formatDate(movement.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.product_name}</div>
                          <div className="text-sm text-gray-600">{movement.product_sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.movement_type === "in" ? "default" : "secondary"}>
                          <div className="flex items-center gap-1">
                            {movement.movement_type === "in" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {movement.movement_type === "in" ? "Stock In" : "Stock Out"}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>{movement.username}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No stock movements recorded
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
