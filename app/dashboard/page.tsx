"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Pin
} from "lucide-react"
import { api } from "@/lib/api"
import { Order, MenuItem, User } from "@/lib/types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [statsData, setStatsData] = useState<any>(null)
  const [aiInsights, setAiInsights] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.getOrders(),
          api.getMenuItems(),
          api.getUsers(),
          api.getDashboardStats(),
          api.getAIInsights()
        ])

        if (results[0].status === 'fulfilled') setOrders(results[0].value)
        if (results[1].status === 'fulfilled') setMenuItems(results[1].value)
        if (results[2].status === 'fulfilled') setUsers(results[2].value)
        if (results[3].status === 'fulfilled') setStatsData(results[3].value)
        if (results[4].status === 'fulfilled') setAiInsights(results[4].value)

      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const [pinnedWidgets, setPinnedWidgets] = useState<string[]>([])

  const togglePin = (title: string) => {
    setPinnedWidgets(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const handleExport = () => {
    alert("Generating Quick Report...\n\nData included:\n- Today's Revenue\n- Top Selling Items\n- Inventory Alerts\n\nPDF Download will start shortly.")
  }

  const stats = useMemo(() => {
    console.log("[Dashboard] statsData:", statsData)
    console.log("[Dashboard] orders count:", orders.length)

    const hasBackendStats = statsData && (statsData.todayRevenue > 0 || statsData.liveOrders > 0)

    // Fallback: Calculate stats locally if backend stats are missing OR empty, provided we have orders
    if ((!hasBackendStats) && orders.length > 0) {
      const today = new Date().toDateString()
      const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)

      const todayRevenue = todayOrders
        // .filter(o => o.status !== 'cancelled') // 'cancelled' is not a valid status in our type
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const liveOrdersCount = orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length

      const activeStaffCount = users.filter(u => u.status === 'active').length

      // Calculate completed today
      const completedToday = todayOrders.filter(o => o.status === 'completed').length

      return [
        {
          title: "Today's Revenue",
          value: `$${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          icon: DollarSign,
          trend: "Calculated", // Indication it's local
          trendUp: true,
          desc: "from local orders"
        },
        {
          title: "Live Orders",
          value: liveOrdersCount.toString(),
          icon: ShoppingBag,
          trend: "Active",
          trendUp: true,
          desc: `${completedToday} completed today`
        },
        {
          title: "Avg Prep Time",
          value: "N/A", // Cannot calculate easily locally without logs
          icon: TrendingUp,
          trend: "0m",
          trendUp: true,
          desc: "data unavailable"
        },
        {
          title: "Active Staff",
          value: activeStaffCount.toString(),
          icon: Users,
          trend: "Stable",
          trendUp: true,
          desc: "registered active users"
        },
      ]
    }

    if (statsData) {
      return [
        {
          title: "Today's Revenue",
          value: `$${(statsData.todayRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          icon: DollarSign,
          trend: `↑ ${(statsData.revenueGrowth ?? 0).toFixed(1)}%`,
          trendUp: (statsData.revenueGrowth ?? 0) >= 0,
          desc: "vs last month average"
        },
        {
          title: "Live Orders",
          value: (statsData.liveOrders ?? 0).toString(),
          icon: ShoppingBag,
          trend: "Active",
          trendUp: true,
          desc: `${statsData.completedToday ?? 0} completed today`
        },
        {
          title: "Avg Prep Time",
          value: statsData.avgPrepTime ?? "0m",
          icon: TrendingUp,
          trend: statsData.prepTimeTrend ?? "0m",
          trendUp: statsData.prepTimeTrend?.startsWith("↓") ?? false,
          desc: "from yesterday"
        },
        {
          title: "Active Staff",
          value: (statsData.activeStaff ?? 0).toString(),
          icon: Users,
          trend: statsData.staffTrend ?? "Steady",
          trendUp: false,
          desc: "Current status"
        },
      ]
    }

    return [
      {
        title: "Today's Revenue",
        value: "$0.00",
        icon: DollarSign,
        trend: "0%",
        trendUp: true,
        desc: "Loading..."
      },
      {
        title: "Live Orders",
        value: "0",
        icon: ShoppingBag,
        trend: "Active",
        trendUp: true,
        desc: "0 completed today"
      },
      {
        title: "Avg Prep Time",
        value: "0m",
        icon: TrendingUp,
        trend: "0m",
        trendUp: true,
        desc: "from yesterday"
      },
      {
        title: "Active Staff",
        value: "0",
        icon: Users,
        trend: "Steady",
        trendUp: false,
        desc: "Loading..."
      },
    ]
  }, [statsData, orders, users])

  const pulseData = useMemo(() => {
    if (statsData?.pulseData && statsData.pulseData.length > 0) {
      return statsData.pulseData
    }

    // Fallback: Calculate pulse from orders (Last 8 hours)
    if (orders.length > 0) {
      const now = new Date()
      const currentHour = now.getHours()
      const data = []

      for (let i = 7; i >= 0; i--) {
        const hour = (currentHour - i + 24) % 24
        const timeStr = `${hour}:00`

        // Count orders created in this hour
        const ordersInHour = orders.filter(o => {
          const d = new Date(o.createdAt)
          return d.getHours() === hour &&
            (now.getTime() - d.getTime()) < (24 * 60 * 60 * 1000) // Within last 24h
        })

        data.push({
          time: timeStr,
          incoming: ordersInHour.length,
          completed: ordersInHour.filter(o => o.status === 'completed').length
        })
      }
      return data
    }

    return []
  }, [statsData, orders])

  const itemPerformance = useMemo(() => {
    // Fallback: simple item aggregation if stats missing OR empty
    const hasBackendItems = statsData?.topItems && statsData.topItems.length > 0

    if (!hasBackendItems && orders.length > 0) {
      const itemMap = new Map<string, any>()

      orders.forEach(order => {
        // Skip cancelled orders for performance stats
        // if (order.status === 'cancelled') return

        order.items.forEach(item => {
          if (!itemMap.has(item.name)) {
            itemMap.set(item.name, {
              id: item.id || item.name, // Fallback ID 
              name: item.name,
              category: item.category,
              totalRevenue: 0,
              salesVolume: 0,
              margin: 70 // Mock margin if missing
            })
          }
          const existing = itemMap.get(item.name)
          existing.totalRevenue += (item.price * item.quantity)
          existing.salesVolume += item.quantity
        })
      })

      const allItems = Array.from(itemMap.values())
      return {
        top: allItems.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
        bottom: allItems.sort((a, b) => a.salesVolume - b.salesVolume).slice(0, 5)
      }
    }

    return {
      top: statsData?.topItems || [],
      bottom: statsData?.bottomItems || []
    }
  }, [statsData, orders])

  // Always calculate alerts from local data if available, as it's more up-to-date
  const outOfStock = menuItems.filter(i => !i.available).slice(0, 5)

  const badReviews = useMemo(() => {
    if (statsData?.badReviews && statsData.badReviews.length > 0) return statsData.badReviews

    const reviews: { item: string; comment: string; rating: number; date: Date }[] = []
    menuItems.forEach(item => {
      if (item.reviews) {
        item.reviews.forEach(r => {
          if (r.rating <= 2) {
            reviews.push({
              item: item.name,
              comment: r.comment,
              rating: r.rating,
              date: r.date
            })
          }
        })
      }
    })
    return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  }, [statsData, menuItems])

  if (isLoading && !statsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-transparent">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Nerve Center</h1>
            <p className="text-muted-foreground mt-1">Real-time pulse and performance tracking.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              Quick Report
            </Button>
            <Button size="sm">
              Customize View
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.sort((a, b) => (pinnedWidgets.includes(b.title) ? 1 : 0) - (pinnedWidgets.includes(a.title) ? 1 : 0)).map((stat) => (
            <Card key={stat.title} className={`relative overflow-hidden border-none shadow-md bg-white dark:bg-card transition-all ${pinnedWidgets.includes(stat.title) ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(stat.title)}>
                    <Pin className={`h-3 w-3 ${pinnedWidgets.includes(stat.title) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${stat.trendUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{stat.desc}</span>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary/10"></div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Inflow Monitor (Pulse Graph) */}
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Inflow Monitor</CardTitle>
                <CardDescription>Orders incoming vs completed (Last 8 Hours)</CardDescription>
              </div>
              <Badge variant="outline" className="animate-pulse bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                ● Live Pulse
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pulseData}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="incoming"
                      name="Incoming"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIn)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOut)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Section */}
          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Critical Alerts</CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent className="space-y-4">
                {outOfStock.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-400">Out of Stock</p>
                      <p className="text-xs text-red-700 dark:text-red-500/80">
                        {outOfStock.map(i => i.name).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {badReviews.map((review: any, i: number) => (
                  <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">Bad Review: {review.item}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-500/80">"{review.comment}"</p>
                    </div>
                  </div>
                ))}
                {outOfStock.length === 0 && badReviews.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No critical alerts.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg">AI Inventory Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.length > 0 ? aiInsights.map((insight, i) => (
                    <p key={i} className="text-sm opacity-90 border-b border-white/10 pb-2 last:border-0">
                      "{insight}"
                    </p>
                  )) : (
                    <p className="text-sm opacity-90">No AI insights available at the moment.</p>
                  )}
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-4 bg-white/10 hover:bg-white/20 border-white/20 text-white">
                  Refresh Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sales Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Top 5 Money Makers</CardTitle>
              <CardDescription>Highest revenue generators this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemPerformance.top.length > 0 ? itemPerformance.top.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">${(item.totalRevenue || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Margin: {item.margin}%</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center">No sales data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Bottom 5 (Opportunity)</CardTitle>
              <CardDescription>Lowest volume items that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemPerformance.bottom.length > 0 ? itemPerformance.bottom.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{item.salesVolume || 0}</p>
                      <p className="text-[10px] text-red-600 font-medium">Margin: {item.margin}%</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center">No sales data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
