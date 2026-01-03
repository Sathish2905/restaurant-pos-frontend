"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MenuGrid } from "@/components/pos/menu-grid"
import { Cart } from "@/components/pos/cart"
import { TableSelector } from "@/components/pos/table-selector"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type CartItem,
  type Table,
  type Order,
  type MenuItem,
  type Floor,
  type Category,
} from "@/lib/types"
import { api } from "@/lib/api"
import { ShoppingCart, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { useOrderUpdates, useTableUpdates } from "@/lib/websocket-hooks"

export function POSContent() {
  const searchParams = useSearchParams()
  const tableIdFromUrl = searchParams.get("tableId")
  const orderIdFromUrl = searchParams.get("orderId")

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  // Data state management with auto-sync
  const { orders, setOrders, isLoading: ordersLoading, refresh: refreshOrders } = useOrderUpdates()
  const { tables, setTables, isLoading: tablesLoading, refresh: refreshTables } = useTableUpdates()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [selectedFloorId, setSelectedFloorId] = useState("")
  const [showTableSelection, setShowTableSelection] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaticData()
  }, [])

  const fetchStaticData = async () => {
    try {
      const [fetchedGenericMenuItems, fetchedFloors, fetchedCategories] = await Promise.all([
        api.getMenuItems(),
        api.getFloors(),
        api.getCategories(),
      ])

      const fetchedMenuItems = fetchedGenericMenuItems as MenuItem[]

      setMenuItems(fetchedMenuItems)
      setFloors(fetchedFloors)
      setCategories(fetchedCategories)

      if (fetchedFloors.length > 0) {
        setSelectedFloorId(fetchedFloors[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch static POS data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only run if data is loaded
    if (loading) return

    const loadUrlData = async () => {
      if (tableIdFromUrl) {
        const table = tables.find((t) => t.id === tableIdFromUrl)
        if (table) {
          setSelectedTable(table)
          setSelectedFloorId(table.floorId)
        }
      }

      if (orderIdFromUrl) {
        // Fetch specific order or find in list if we had getOrders (but we don't fetch orders here yet)
        // Let's fetch orders here just for this usage, or implement api.getOrder(id)
        // For now, let's assume we can fetch all orders
        try {
          const orders = await api.getOrders()
          const order = orders.find((o) => o.id === orderIdFromUrl)
          if (order) {
            setEditingOrder(order)
            // Load order items into cart
            setCart(
              order.items.map((item) => ({
                ...item,
                category: menuItems.find((m) => m.name === item.name)?.category || "Other",
              })),
            )
          }
        } catch (err) {
          console.error("Failed to load order", err)
        }
      }
    }

    loadUrlData()
  }, [tableIdFromUrl, orderIdFromUrl, loading, tables, menuItems])

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id)
      if (existingItem) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId))
    } else {
      setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)))
    }
  }

  const clearCart = () => {
    setCart([])
    setSelectedTable(null)
    setEditingOrder(null)
  }

  const handleTableSelect = (table: Table | null, order?: Order) => {
    setSelectedTable(table)
    setShowTableSelection(false)

    if (order) {
      setEditingOrder(order)
      setCart(
        order.items.map((item) => ({
          ...item,
          available: true, // Optimistic
          image: "/placeholder.svg", // Placeholder
          category: menuItems.find((m) => m.id === item.id || m.name === item.name)?.category || "Other",
        })),
      )
    } else {
      setEditingOrder(null)
      // We don't necessarily want to clear the cart if they just wanted to assign it to a table
      // But if they were switching tables, it's a bit ambiguous.
      // Usually, selecting a new table for current cart is fine.
    }
  }


  const refreshData = async () => {
    await Promise.all([refreshOrders(), refreshTables()])
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-auto relative">
        {showTableSelection ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Select Table</h2>
                <p className="text-sm text-muted-foreground">Choose a table for this order</p>
              </div>
              <Button variant="outline" onClick={() => setShowTableSelection(false)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>

            <Tabs value={selectedFloorId} onValueChange={setSelectedFloorId}>
              <TabsList>
                {floors.map((floor) => (
                  <TabsTrigger key={floor.id} value={floor.id}>
                    {floor.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {floors.map((floor) => (
                <TabsContent key={floor.id} value={floor.id} className="mt-4">
                  <TableSelector
                    tables={tables}
                    orders={orders}
                    floors={floors}
                    selectedFloorId={floor.id}
                    selectedTableId={selectedTable?.id}
                    onTableClick={handleTableSelect}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="relative">
            {editingOrder && (
              <div className="sticky top-0 z-10 bg-primary/10 border-b border-primary/20 p-3">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="default" className="text-sm">
                    Editing Order #{editingOrder.id}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    • Created at {new Date(editingOrder.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
            <MenuGrid
              items={menuItems}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onAddToCart={addToCart}
            />
          </div>
        )}
      </div>
      <Cart
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        selectedTable={selectedTable}
        onSelectTable={() => setShowTableSelection(true)}
        editingOrder={editingOrder}
        floors={floors}
        onRefreshData={refreshData}
      />
    </div>
  )
}
