import { type NextRequest, NextResponse } from "next/server"
import { updateProduct, deleteProduct } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productData = await request.json()
    const product = await updateProduct(params.id, productData)

    if (product) {
      return NextResponse.json(product)
    } else {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Update product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await deleteProduct(params.id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
