"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type Order } from "@/lib/types"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Search, Eye, Plus, Receipt, Banknote, CheckCircle, Bike, Edit, User, Phone, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { ReceiptDialog } from "@/components/receipt-dialog"
import { Separator } from "@/components/ui/separator"

export function OrdersContent() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const data = await api.getOrders()
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "preparing":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "ready":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return ""
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "unpaid":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "partial":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "swiggy":
        return { text: "Swiggy", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: "🍊" }
      case "zomato":
        return { text: "Zomato", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: "🍅" }
      default:
        return { text: "POS", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: "🏪" }
    }
  }

  const handleProcessPayment = async (paymentMethod: "cash" | "card") => {
    if (!receiptOrder) return

    try {
      const updatedOrder = await api.updateOrder(receiptOrder.id, {
        paymentStatus: "paid",
        status: "completed",
        updatedAt: new Date(),
      })

      if (updatedOrder) {
        setOrders((prev) => prev.map((o) => (o.id === receiptOrder.id ? updatedOrder : o)))
        setReceiptOrder(updatedOrder)
        alert(`Payment received via ${paymentMethod}. Order closed successfully!`)
      }
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Failed to process payment. Please try again.")
    }
  }

  const handleViewReceipt = (order: Order) => {
    setReceiptOrder(order)
    setShowReceipt(true)
  }

  const handleCloseOrder = async (order: Order) => {
    if (order.paymentStatus !== "paid") {
      alert("Please process payment before closing the order")
      return
    }

    try {
      const updatedOrder = await api.updateOrder(order.id, {
        status: "completed",
        updatedAt: new Date(),
      })

      if (updatedOrder) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))
        setSelectedOrder(updatedOrder)
        alert("Order closed successfully!")
      }
    } catch (error) {
      console.error("Failed to close order:", error)
      alert("Failed to close order. Please try again.")
    }
  }

  return (
    <>
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Orders</h1>
              <p className="text-muted-foreground">Manage and track all restaurant orders</p>
            </div>
            <Button onClick={() => router.push("/pos")}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, table, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("new")}
              >
                New
              </Button>
              <Button
                variant={filterStatus === "preparing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("preparing")}
              >
                Preparing
              </Button>
              <Button
                variant={filterStatus === "ready" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("ready")}
              >
                Ready
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("completed")}
              >
                Completed
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Table/Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const sourceBadge = getSourceBadge(order.source)
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-xs">{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[10px] h-5 px-1.5">
                          {(order.type || "dine-in").replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", sourceBadge.color)}>
                          {sourceBadge.icon} {sourceBadge.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.source === "swiggy" || order.source === "zomato" ? (
                          <div className="flex items-center gap-2">
                            <Bike className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{order.customerName || "Delivery"}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{order.deliveryPhone}</div>
                            </div>
                          </div>
                        ) : order.type === "dine-in" && order.tableNumber ? (
                          <div>
                            <div className="font-medium text-sm">Table {order.tableNumber}</div>
                            <div className="text-[10px] text-muted-foreground">{order.floorName}</div>
                          </div>
                        ) : (order.type === "takeaway" || order.type === "delivery") ? (
                          <div className="flex items-center gap-2">
                            {order.type === "delivery" ? <Bike className="h-4 w-4 text-muted-foreground shrink-0" /> : <User className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{order.customerName || "Customer"}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{order.deliveryPhone}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus || "unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/pos?orderId=${order.id}${order.tableId ? `&tableId=${order.tableId}` : ''}`)}
                            disabled={order.status === 'completed'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewReceipt(order)}>
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order Details - {selectedOrder?.id}
              {selectedOrder && (
                <Badge variant="outline" className={getSourceBadge(selectedOrder.source).color}>
                  {getSourceBadge(selectedOrder.source).icon} {getSourceBadge(selectedOrder.source).text}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Created {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cashier/Platform</p>
                  <p className="font-medium">{selectedOrder.cashierName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedOrder.type === "dine-in" ? "Table" : "Customer Area"}
                  </p>
                  <p className="font-medium">
                    {selectedOrder.type === "dine-in"
                      ? selectedOrder.tableNumber
                        ? `Table ${selectedOrder.tableNumber}`
                        : "No table"
                      : selectedOrder.customerName || "Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Type</p>
                  <Badge variant="outline" className="capitalize">
                    {(selectedOrder.type || "dine-in").replace("-", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <Badge variant="outline" className={getSourceBadge(selectedOrder.source).color}>
                    {getSourceBadge(selectedOrder.source).icon} {getSourceBadge(selectedOrder.source).text}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                  <Badge variant="outline" className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus || "unpaid"}
                  </Badge>
                </div>
              </div>

              {(selectedOrder.source === "swiggy" || selectedOrder.source === "zomato" || selectedOrder.type === "takeaway" || selectedOrder.type === "delivery") && (selectedOrder.customerName || selectedOrder.deliveryPhone || selectedOrder.deliveryAddress) && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedOrder.type === "delivery" || selectedOrder.source !== "pos" ? <Bike className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <p className="font-semibold">
                      {selectedOrder.type === "delivery" || selectedOrder.source !== "pos" ? "Delivery Details" : "Customer Details"}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.customerName && (
                      <div>
                        <p className="text-muted-foreground">Customer Name</p>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      </div>
                    )}
                    {selectedOrder.deliveryPhone && (
                      <div>
                        <p className="text-muted-foreground">Phone Number</p>
                        <p className="font-medium">{selectedOrder.deliveryPhone}</p>
                      </div>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <div>
                        <p className="text-muted-foreground">Delivery Address</p>
                        <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(selectedOrder.total - selectedOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-3 bg-muted rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              <Separator />
              <div className="flex gap-2">
                {selectedOrder.paymentStatus !== "paid" && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setSelectedOrder(null)
                        handleViewReceipt(selectedOrder)
                      }}
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  </>
                )}
                {selectedOrder.status !== "completed" && (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleCloseOrder(selectedOrder)}
                    disabled={selectedOrder.paymentStatus !== "paid"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Order
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null)
                    handleViewReceipt(selectedOrder)
                  }}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        order={receiptOrder}
        open={showReceipt}
        onOpenChange={setShowReceipt}
        onProcessPayment={handleProcessPayment}
        showPaymentOptions={receiptOrder?.paymentStatus !== "paid"}
      />
    </>
  )
}
