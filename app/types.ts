export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  minStock: number
  description: string
  supplier: string
  createdAt: Date
  updatedAt: Date
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: "in" | "out"
  quantity: number
  reason: string
  date: Date
  notes?: string
}

export interface Sale {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  date: Date
  customer: string
}
