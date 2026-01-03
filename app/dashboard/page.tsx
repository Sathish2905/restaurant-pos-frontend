"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react"
import { api } from "@/lib/api"
import { Order, MenuItem, User } from "@/lib/types"

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedOrders, fetchedMenuItems, fetchedUsers] = await Promise.all([
          api.getOrders(),
          api.getMenuItems(),
          api.getUsers()
        ])
        setOrders(fetchedOrders)
        setMenuItems(fetchedMenuItems)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate stats
  const todayOrders = orders.length
  const todayRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0
  const totalStaff = users.length

  const stats = [
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Orders Today",
      value: todayOrders.toString(),
      icon: ShoppingBag,
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      trend: "+3.1%",
      trendUp: true,
    },
    {
      title: "Active Staff",
      value: totalStaff.toString(),
      icon: Users,
      trend: "0%",
      trendUp: false,
    },
  ]

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${stat.trendUp ? "text-primary" : "text-muted-foreground"} mt-1`}>
                    {stat.trend} from yesterday
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Orders & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • {order.cashierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Total Menu Items</span>
                  <span className="text-lg font-bold">{menuItems.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Available Items</span>
                  <span className="text-lg font-bold text-primary">
                    {menuItems.filter((i) => i.available).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Out of Stock</span>
                  <span className="text-lg font-bold text-destructive">
                    {menuItems.filter((i) => !i.available).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Avg Price</span>
                  <span className="text-lg font-bold">
                    ${(menuItems.length > 0 ? (menuItems.reduce((sum, i) => sum + i.price, 0) / menuItems.length) : 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
