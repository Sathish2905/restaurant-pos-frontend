"use client"

import { useEffect, useState } from "react"
import { type Table, type Order, type Floor } from "@/lib/types"
import { api } from "@/lib/api"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { TableSelector } from "@/components/pos/table-selector"

import { useOrderUpdates, useTableUpdates } from "@/lib/websocket-hooks"

export function TableViewContent() {
  const { tables, setTables, isLoading: tablesLoading } = useTableUpdates()
  const { orders, setOrders, isLoading: ordersLoading } = useOrderUpdates()

  const [floors, setFloors] = useState<Floor[]>([])
  const [selectedFloorId, setSelectedFloorId] = useState("")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    fetchFloors()
  }, [])

  const fetchFloors = async () => {
    try {
      const fetchedFloors = await api.getFloors()
      setFloors(fetchedFloors)

      if (fetchedFloors.length > 0) {
        setSelectedFloorId(fetchedFloors[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch floors", error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentFloor = floors.find((f) => f.id === selectedFloorId)

  // Get order for a table
  const getTableOrder = (tableId: string) => {
    return orders.find(
      (order) => order.tableId === tableId && order.status !== "completed",
    )
  }

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order)),
    )
  }

  const handleUpdatePaymentStatus = (orderId: string, newStatus: Order["paymentStatus"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: newStatus, updatedAt: new Date() } : order,
      ),
    )
  }

  const handleTableClick = (table: Table) => {
    const order = getTableOrder(table.id)
    if (order) {
      // Edit existing order - go to POS with order ID
      router.push(`/pos?tableId=${table.id}&orderId=${order.id}`)
    } else {
      // New order - go to POS with just table ID
      router.push(`/pos?tableId=${table.id}`)
    }
  }


  return (
    <>
      <div className="flex-1 flex flex-col p-6 gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Table View</h1>
            <p className="text-muted-foreground">Monitor tables and manage orders</p>
          </div>
        </div>

        <Tabs value={selectedFloorId} onValueChange={setSelectedFloorId} className="flex-1 flex flex-col">
          <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${floors.length}, 1fr)` }}>
            {floors.map((floor) => (
              <TabsTrigger key={floor.id} value={floor.id}>
                {floor.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {floors.map((floor) => (
            <TabsContent key={floor.id} value={floor.id} className="flex-1 mt-6">
              <TableSelector
                tables={tables}
                orders={orders}
                floors={floors}
                selectedFloorId={floor.id}
                onTableClick={handleTableClick}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Order Details Dialog - Removed since we navigate to POS instead */}
    </>
  )
}
