"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, Receipt, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CartItem, Table, Floor, Order } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { ReceiptDialog } from "@/components/receipt-dialog"
import { api } from "@/lib/api"

interface CartProps {
  cart: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onClearCart: () => void
  selectedTable: Table | null
  onSelectTable: () => void
  editingOrder?: Order | null
  floors: Floor[]
  onRefreshData?: () => void
}

const TAX_RATE = 0.1 // 10%

export function Cart({ cart, onUpdateQuantity, onClearCart, selectedTable, onSelectTable, editingOrder, floors, onRefreshData }: CartProps) {
  const [discount, setDiscount] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const { user } = useAuth()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax - discount

  const handleCheckout = () => {
    setShowCheckout(true)
  }

  const handleCompleteOrder = async () => {
    const orderData = {
      items: cart,
      subtotal,
      total,
      tax,
      discount,
      status: "new" as const,
      paymentStatus: "unpaid" as const,
      cashierName: user?.name || "Unknown",
      tableId: selectedTable?.id,
      tableNumber: selectedTable?.number,
      floorName: selectedTable ? getFloorName(selectedTable.floorId) : undefined,
    }

    if (editingOrder) {
      try {
        const updatedOrder = await api.updateOrder(editingOrder.id, {
          ...orderData,
          updatedAt: new Date(),
        })

        if (updatedOrder) {
          setCompletedOrder(updatedOrder)
          setShowCheckout(false)
          setShowReceipt(true)
          onClearCart()
          setDiscount(0)
        }
      } catch (error) {
        console.error("Failed to update order", error)
        alert("Failed to update order")
      }
    } else {
      try {
        const newOrder = await api.createOrder(orderData)

        if (newOrder) {
          // Update table status to occupied if linked
          if (selectedTable) {
            await api.updateTable(selectedTable.id, { status: "occupied" })
          }

          setCompletedOrder(newOrder)
          setShowCheckout(false)
          setShowReceipt(true)
          onClearCart()
          setDiscount(0)
          onRefreshData?.()
        }
      } catch (error) {
        console.error("Failed to create order", error)
        alert("Failed to create order")
      }
    }
  }

  const handleProcessPayment = async (paymentMethod: "cash" | "card") => {
    if (!completedOrder) return

    try {
      const updatedOrder = await api.updateOrder(completedOrder.id, {
        paymentStatus: "paid",
        status: "completed",
      })

      if (updatedOrder) {
        // Update table status to available if linked
        if (completedOrder.tableId) {
          await api.updateTable(completedOrder.tableId, { status: "available" })
        }

        setCompletedOrder(updatedOrder)
        alert(`Payment of $${completedOrder.total.toFixed(2)} received via ${paymentMethod}. Order closed successfully!`)
        onRefreshData?.()
      }
    } catch (error) {
      console.error("Failed to process payment", error)
      alert("Failed to process payment")
    }
  }

  const getFloorName = (floorId: string) => {
    return floors.find((f) => f.id === floorId)?.name || "Unknown"
  }

  return (
    <>
      <Card className="w-[400px] border-l rounded-none flex flex-col h-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {editingOrder ? "Update Order" : "Current Order"}
          </CardTitle>
          <div className="pt-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={onSelectTable}>
              <MapPin className="h-4 w-4 mr-2" />
              {selectedTable ? (
                <div className="flex items-center gap-2 flex-1 justify-between">
                  <span>
                    Table {selectedTable.number} - {getFloorName(selectedTable.floorId)}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {selectedTable.capacity} seats
                  </Badge>
                </div>
              ) : (
                <span>Select Table</span>
              )}
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Add items to start an order</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onUpdateQuantity(item.id, 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </ScrollArea>

        <CardFooter className="flex-col gap-4 border-t p-4 flex-shrink-0">
          <div className="w-full space-y-3">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount ($)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="w-full flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onClearCart}
              disabled={cart.length === 0}
            >
              Clear
            </Button>
            <Button className="flex-1" onClick={handleCheckout} disabled={cart.length === 0}>
              {editingOrder ? "Update" : "Checkout"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Update Order" : "Complete Order"}</DialogTitle>
            <DialogDescription>Review and confirm the order details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTable && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">
                  Table {selectedTable.number} - {getFloorName(selectedTable.floorId)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Capacity: {selectedTable.capacity} guests • {selectedTable.shape}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteOrder}>{editingOrder ? "Update Order" : "Confirm Order"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        order={completedOrder}
        open={showReceipt}
        onOpenChange={setShowReceipt}
        onProcessPayment={handleProcessPayment}
        showPaymentOptions={completedOrder?.paymentStatus !== "paid"}
      />
    </>
  )
}
