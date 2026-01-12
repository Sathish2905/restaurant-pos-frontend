"use client"

import { useEffect, useRef, useState } from "react"
import { api, normalizeId } from "./api"
import { Order, Table } from "./types"
import { socket } from "./socket"
import { toast } from "sonner"

/**
 * Hook for subscribing to order updates via Socket.io
 */
export function useOrderUpdates(onUpdate?: (orders: Order[]) => void) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)

  const fetchOrders = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const fetchedOrders = await api.getOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      console.error("[useOrderUpdates] Sync error:", error)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }

  // Trigger onUpdate whenever orders change
  useEffect(() => {
    if (onUpdate && orders.length > 0) {
      onUpdate(orders)
    }
  }, [orders, onUpdate])

  useEffect(() => {
    fetchOrders()

    const handleOrderCreated = (newOrder: any) => {
      console.log("[Socket] Order created event:", newOrder)
      const normalizedOrder = {
        ...newOrder,
        id: normalizeId(newOrder)
      }
      setOrders((prev) => [normalizedOrder, ...prev])
      toast.success("New Order received!", {
        description: `Order #${normalizedOrder.id.slice(-4)} for Table ${normalizedOrder.tableNumber || 'N/A'}`
      })
    }

    const handleOrderUpdated = (updatedOrder: any) => {
      console.log("[Socket] Order updated event:", updatedOrder)
      const normalizedUpdate = {
        ...updatedOrder,
        id: normalizeId(updatedOrder)
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === normalizedUpdate.id ? { ...o, ...normalizedUpdate } : o))
      )
    }

    const handleOrderDeleted = (orderId: any) => {
      console.log("[Socket] Order deleted event:", orderId)
      const idToRemove = normalizeId(orderId)
      setOrders((prev) => prev.filter((o) => o.id !== idToRemove))
    }

    socket.on("orderCreated", handleOrderCreated)
    socket.on("orderUpdated", handleOrderUpdated)
    socket.on("orderDeleted", handleOrderDeleted)

    // Log connection status
    if (!socket.connected) {
      console.log("[Socket] Connecting...")
      socket.connect()
    }

    return () => {
      socket.off("orderCreated", handleOrderCreated)
      socket.off("orderUpdated", handleOrderUpdated)
      socket.off("orderDeleted", handleOrderDeleted)
    }
  }, [])

  return { orders, setOrders, isLoading, refresh: fetchOrders }
}

/**
 * Hook for subscribing to table updates via Socket.io
 */
export function useTableUpdates(onUpdate?: (tables: Table[]) => void) {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)

  const fetchTables = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const fetchedTables = await api.getTables()
      setTables(fetchedTables)
    } catch (error) {
      console.error("[useTableUpdates] Sync error:", error)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }

  // Trigger onUpdate whenever tables change
  useEffect(() => {
    if (onUpdate && tables.length > 0) {
      onUpdate(tables)
    }
  }, [tables, onUpdate])

  useEffect(() => {
    fetchTables()

    const handleTableUpdated = (data: any) => {
      console.log("[Socket] Table update event:", data)
      const targetId = normalizeId(data.tableId || data)

      setTables((prev) =>
        prev.map((t) => {
          if (t.id === targetId) {
            // merge data but preserve critical fields if not in data
            return {
              ...t,
              ...(typeof data === 'object' ? data : {}),
              id: t.id, // ensure ID is preserved
              // floorId mapping if present
              floorId: normalizeId(data.floorId || data.floor || t.floorId)
            }
          }
          return t
        })
      )
    }

    socket.on("tableUpdated", handleTableUpdated)

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off("tableUpdated", handleTableUpdated)
    }
  }, [])

  return { tables, setTables, isLoading, refresh: fetchTables }
}
