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
import { Plus, TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import type { Product, StockMovement } from "@/lib/database"

interface StockMovementsTabProps {
  onDataChange: () => void
}

export default function StockMovementsTab({ onDataChange }: StockMovementsTabProps) {
  const { user } = useAuth()
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    product_id: "",
    type: "",
    quantity: "",
    reason: "",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [movementsRes, productsRes] = await Promise.all([fetch("/api/stock-movements"), fetch("/api/products")])

      if (movementsRes.ok) {
        const movementsData = await movementsRes.json()
        setStockMovements(movementsData)
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
      type: "",
      quantity: "",
      reason: "",
      notes: "",
    })
    setError("")
  }

  const validateForm = () => {
    if (!formData.product_id) {
      setError("Please select a product")
      return false
    }
    if (!formData.type) {
      setError("Please select movement type")
      return false
    }
    if (!formData.quantity || Number.parseInt(formData.quantity) <= 0) {
      setError("Please enter a valid quantity")
      return false
    }
    if (!formData.reason.trim()) {
      setError("Please enter a reason for the movement")
      return false
    }

    // Additional validation for stock out
    if (formData.type === "out") {
      const selectedProduct = products.find((p) => p.id === formData.product_id)
      if (selectedProduct && Number.parseInt(formData.quantity) > selectedProduct.stock) {
        setError(`Cannot remove ${formData.quantity} units. Only ${selectedProduct.stock} units available.`)
        return false
      }
    }

    return true
  }

  const handleAddMovement = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setError("")

      // Create a safe user identifier
      const userIdentifier = user?.username || user?.email || user?.id || "anonymous"

      const response = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: formData.product_id,
          type: formData.type,
          quantity: Number.parseInt(formData.quantity),
          reason: formData.reason.trim(),
          notes: formData.notes.trim() || null,
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
        setError(errorData.error || "Failed to create stock movement")
      }
    } catch (error) {
      console.error("Error adding movement:", error)
      setError("Network error. Please try again.")
    }
  }

  const totalStockIn = stockMovements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0)
  const totalStockOut = stockMovements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0)

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
          <h2 className="text-2xl font-bold text-slate-800">Stock Movements</h2>
          <p className="text-slate-600">Track all stock in and out movements</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Stock Movement</DialogTitle>
              <DialogDescription>Record a new stock in or out movement.</DialogDescription>
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
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Movement Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, type: value })
                      setError("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => {
                    setFormData({ ...formData, reason: e.target.value })
                    setError("")
                  }}
                  placeholder="e.g., Purchase Order, Sale, Damage, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this movement"
                  rows={3}
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
              <Button onClick={handleAddMovement} className="bg-green-600 hover:bg-green-700">
                Add Movement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Stock In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">+{totalStockIn}</div>
            <p className="text-xs text-green-600">Units added to inventory</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Stock Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">-{totalStockOut}</div>
            <p className="text-xs text-red-600">Units removed from inventory</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Movements</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stockMovements.length}</div>
            <p className="text-xs text-blue-600">Stock movements recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
          <CardDescription>All stock in and out movements with details</CardDescription>
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
                  <TableHead>Notes</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No stock movements recorded yet. Add your first movement to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  stockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm">
                        {new Date(movement.created_at).toLocaleDateString()}{" "}
                        {new Date(movement.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">{movement.product_name}</TableCell>
                      <TableCell>
                        {movement.type === "in" ? (
                          <Badge className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Stock In
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Stock Out
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
                      <TableCell className="text-sm text-slate-600">{movement.notes || "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600">{movement.created_by || "System"}</TableCell>
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
