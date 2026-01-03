"use client"

import { useState, useEffect } from "react"
import { OrderCard } from "@/components/kitchen/order-card"
import { type Order, type OrderStatus } from "@/lib/types"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

import { useOrderUpdates } from "@/lib/websocket-hooks"

export default function KitchenPage() {
  const { orders, setOrders, isLoading } = useOrderUpdates()

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrder(orderId, { status: newStatus })
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const newOrders = orders.filter((o) => o.status === "new")
  const preparingOrders = orders.filter((o) => o.status === "preparing")
  const readyOrders = orders.filter((o) => o.status === "ready")

  return (
    <div className="flex-1 overflow-auto bg-muted/30">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Orders</h2>
              <Badge variant="destructive" className="h-6 px-2">
                {newOrders.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {newOrders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
              ))}
              {newOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-dashed">
                  <p className="text-sm">No new orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preparing</h2>
              <Badge className="h-6 px-2 bg-accent text-accent-foreground">{preparingOrders.length}</Badge>
            </div>
            <div className="space-y-3">
              {preparingOrders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-dashed">
                  <p className="text-sm">No orders in preparation</p>
                </div>
              )}
            </div>
          </div>

          {/* Ready Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ready</h2>
              <Badge variant="secondary" className="h-6 px-2 bg-primary text-primary-foreground">
                {readyOrders.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {readyOrders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-dashed">
                  <p className="text-sm">No orders ready</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
