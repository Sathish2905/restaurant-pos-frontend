"use client"

import { useState, useEffect, useRef } from "react"
import { KDSOrderCard } from "@/components/kitchen/kds-order-card"
import { MiseEnPlaceFooter } from "@/components/kitchen/mise-en-place-footer"
import { type Order, type OrderStatus } from "@/lib/types"
import { socket } from "@/lib/socket"
import { api, updateOrderItemStatus, pingWaiter } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useOrderUpdates } from "@/lib/websocket-hooks"
import { LayoutDashboard, Kanban, Bell, EyeOff, Star, Search, Settings2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function KitchenPage() {
  const { orders, setOrders, isLoading } = useOrderUpdates()
  const [activeTab, setActiveTab] = useState("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [socketStatus, setSocketStatus] = useState(socket.connected ? "connected" : "disconnected")
  const prevOrdersCount = useRef(orders.length)

  useEffect(() => {
    const onConnect = () => setSocketStatus("connected")
    const onDisconnect = () => setSocketStatus("disconnected")
    const onError = () => setSocketStatus("error")

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onError)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error", onError)
    }
  }, [])

  // Sound Alert for New Orders
  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      playAlert()
      toast.info("New Order Received", {
        description: `Order #${orders[0].id.slice(-4)} is now in the queue.`,
        duration: 5000,
      })
    }
    prevOrdersCount.current = orders.length
  }, [orders.length])

  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio alert failed", e)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrder(orderId, { status: newStatus })
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
        toast.success(`Order ${newStatus}`)
      }
    } catch (error) {
      toast.error("Failed to update order")
    }
  }

  const handleUpdateItemStatus = async (orderId: string, itemId: string, isReady: boolean) => {
    try {
      // Optimistic Update
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            items: o.items.map(i => i.id === itemId ? { ...i, isReady } : i)
          }
        }
        return o
      }))

      const updated = await updateOrderItemStatus(orderId, itemId, isReady)
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      }
    } catch (error) {
      toast.error("Failed to update item status")
    }
  }

  const handlePingWaiter = async (orderId: string) => {
    const success = await pingWaiter(orderId)
    if (success) {
      toast.success("Waiter notified for pickup")
    } else {
      toast.error("Failed to notify waiter")
    }
  }

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const newOrders = filteredOrders.filter((o) => o.status === "new")
  const preparingOrders = filteredOrders.filter((o) => o.status === "preparing")
  const readyOrders = filteredOrders.filter((o) => o.status === "ready")

  // Overview Aggregation
  const activeDishes = orders.reduce((acc, order) => {
    if (order.status === "completed") return acc
    order.items.forEach(item => {
      if (!item.isReady) {
        const key = item.name
        if (!acc[key]) {
          acc[key] = { count: 0, orders: [], isFavorite: item.isFavoriteKitchen }
        }
        acc[key].count += item.quantity
        acc[key].orders.push(order.id.slice(-4))
      }
    })
    return acc
  }, {} as Record<string, { count: number, orders: string[], isFavorite?: boolean }>)

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-50 dark selection:bg-primary/30">
      {/* KDS Header */}
      <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-white">CHEF COMMAND</h1>
            <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Live Kitchen Display System</span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="ml-8">
            <TabsList className="bg-slate-800 border-none p-1">
              <TabsTrigger value="kanban" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold text-xs uppercase">
                <Kanban className="h-3.5 w-3.5" /> Kanban Board
              </TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold text-xs uppercase">
                <LayoutDashboard className="h-3.5 w-3.5" /> Command Center
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search orders or items..."
              className="bg-slate-800 border-slate-700 pl-10 h-10 text-xs font-medium focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800 hover:bg-slate-700 h-10 w-10">
            <Settings2 className="h-4 w-4 text-slate-400" />
          </Button>
          <Button
            variant={showOutOfStock ? "secondary" : "outline"}
            size="icon"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 h-10 w-10"
            onClick={() => setShowOutOfStock(!showOutOfStock)}
          >
            <EyeOff className={cn("h-4 w-4", showOutOfStock ? "text-primary" : "text-slate-400")} />
          </Button>
          <div className="h-8 w-[1px] bg-slate-800 mx-2" />
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn(
                "text-[10px] font-bold uppercase py-0 px-1.5 border-none",
                socketStatus === "connected" ? "bg-green-500/20 text-green-500" :
                  socketStatus === "disconnected" ? "bg-amber-500/20 text-amber-500 animate-pulse" :
                    "bg-red-500/20 text-red-500"
              )}>
                {socketStatus}
              </Badge>
              <span className="text-xs font-black text-white px-2 py-0.5 bg-red-600 rounded animate-pulse">LIVE</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{orders.length} ACTIVE ORDERS</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="kanban" className="h-full m-0 p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full divide-x divide-slate-800">
              {/* Column: New */}
              <div className="flex flex-col h-full bg-slate-950/50">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <h2 className="text-sm font-black uppercase tracking-widest">Incoming</h2>
                  </div>
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-black">{newOrders.length}</Badge>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {newOrders.map((order) => (
                      <KDSOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateItemStatus={handleUpdateItemStatus}
                        onPingWaiter={handlePingWaiter}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Column: Preparing */}
              <div className="flex flex-col h-full bg-slate-950/50">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                    <h2 className="text-sm font-black uppercase tracking-widest">In Progress</h2>
                  </div>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-black">{preparingOrders.length}</Badge>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {preparingOrders.map((order) => (
                      <KDSOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateItemStatus={handleUpdateItemStatus}
                        onPingWaiter={handlePingWaiter}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Column: Ready */}
              <div className="flex flex-col h-full bg-slate-950/50">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <h2 className="text-sm font-black uppercase tracking-widest">Ready to Plate</h2>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-black">{readyOrders.length}</Badge>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {readyOrders.map((order) => (
                      <KDSOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateItemStatus={handleUpdateItemStatus}
                        onPingWaiter={handlePingWaiter}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="h-full m-0 p-8">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" /> FAVORITES
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(activeDishes).filter(([_, d]) => d.isFavorite).map(([name, data]) => (
                    <div key={name} className="p-6 bg-slate-900 border-2 border-amber-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      </div>
                      <span className="text-4xl font-black text-amber-500">{data.count}</span>
                      <span className="text-xs font-black text-center uppercase tracking-tight text-white">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" /> ALL ACTIVE ITEMS
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(activeDishes).filter(([_, d]) => !d.isFavorite).map(([name, data]) => (
                    <div key={name} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                      <span className="text-3xl font-black text-white">{data.count}</span>
                      <span className="text-[10px] font-bold text-center uppercase tracking-widest text-slate-400 leading-tight">{name}</span>
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {data.orders.map(o => (
                          <span key={o} className="text-[8px] px-1 bg-slate-800 rounded text-slate-500">#{o}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Mise en Place Footer */}
        <MiseEnPlaceFooter orders={orders} />
      </main>
    </div>
  )
}
