"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Printer, CreditCard, Banknote, Check } from "lucide-react"
import type { Order } from "@/lib/types"

interface ReceiptDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProcessPayment?: (paymentMethod: "cash" | "card") => void
  showPaymentOptions?: boolean
}

export function ReceiptDialog({
  order,
  open,
  onOpenChange,
  onProcessPayment,
  showPaymentOptions = false,
}: ReceiptDialogProps) {
  if (!order) return null

  const handlePrint = () => {
    window.print()
  }

  const handlePayment = (method: "cash" | "card") => {
    if (onProcessPayment) {
      onProcessPayment(method)
    }
  }

  const getFloorName = (floorId?: string) => {
    return order.floorName || "N/A"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{showPaymentOptions ? "Complete Payment" : "Order Receipt"}</DialogTitle>
          <DialogDescription className="text-center">
            {showPaymentOptions ? "Select payment method and finalize order" : "Order details and receipt"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Restaurant Header */}
          <div className="text-center border-b pb-4">
            <h3 className="font-bold text-lg">Restaurant POS</h3>
            <p className="text-sm text-muted-foreground">Thank you for dining with us!</p>
          </div>

          {/* Order Information */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cashier:</span>
              <span>{order.cashierName}</span>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table:</span>
                <span>
                  Table {order.tableNumber} - {order.floorName}
                </span>
              </div>
            )}
            {order.customerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span>{order.customerName}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Items</h4>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${(order.total - order.tax + order.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-accent">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Payment Status:</span>
              <Badge
                variant={
                  order.paymentStatus === "paid"
                    ? "default"
                    : order.paymentStatus === "partial"
                      ? "secondary"
                      : "outline"
                }
                className="capitalize"
              >
                {order.paymentStatus || "unpaid"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order Status:</span>
              <Badge variant={order.status === "completed" ? "default" : "secondary"} className="capitalize">
                {order.status}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          {showPaymentOptions && order.paymentStatus !== "paid" ? (
            <>
              <div className="flex gap-2 w-full">
                <Button onClick={() => handlePayment("cash")} className="flex-1" variant="default">
                  <Banknote className="h-4 w-4 mr-2" />
                  Cash Payment
                </Button>
                <Button onClick={() => handlePayment("card")} className="flex-1" variant="default">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card Payment
                </Button>
              </div>
              <Button onClick={handlePrint} variant="outline" className="w-full bg-transparent">
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <Button onClick={handlePrint} variant="outline" className="flex-1 bg-transparent">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
