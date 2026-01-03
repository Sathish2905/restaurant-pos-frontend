"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "./api"
import { Order, Table } from "./types"

/**
 * Hook for WebSocket connection
 * This is a placeholder for future real-time functionality
 */
export function useWebSocket(url?: string) {
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!url) return
    console.log("[v0] WebSocket hook ready for integration")
  }, [url])

  return ws.current
}

/**
 * Hook for subscribing to order updates via polling
 */
export function useOrderUpdates(onUpdate?: (orders: Order[]) => void) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastFetchedRef = useRef<string>("")

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await api.getOrders()
      const ordersString = JSON.stringify(fetchedOrders)

      // Only trigger updates if data actually changed
      if (ordersString !== lastFetchedRef.current) {
        lastFetchedRef.current = ordersString
        setOrders(fetchedOrders)
        if (onUpdate) onUpdate(fetchedOrders)
      }
    } catch (error) {
      console.error("Failed to fetch orders for sync:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return { orders, setOrders, isLoading, refresh: fetchOrders }
}

/**
 * Hook for subscribing to table updates via polling
 */
export function useTableUpdates(onUpdate?: (tables: Table[]) => void) {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastFetchedRef = useRef<string>("")

  const fetchTables = async () => {
    try {
      const fetchedTables = await api.getTables()
      const tablesString = JSON.stringify(fetchedTables)

      if (tablesString !== lastFetchedRef.current) {
        lastFetchedRef.current = tablesString
        setTables(fetchedTables)
        if (onUpdate) onUpdate(fetchedTables)
      }
    } catch (error) {
      console.error("Failed to fetch tables for sync:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
    const interval = setInterval(fetchTables, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return { tables, setTables, isLoading, refresh: fetchTables }
}
