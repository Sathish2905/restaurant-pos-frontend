"use client"

import { Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  order: Order
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void
}

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const getTimeSince = (dateInput: Date | string) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Just now"
    if (minutes === 1) return "1 min ago"
    return `${minutes} mins ago`
  }

  const handleStatusChange = () => {
    if (order.status === "new") {
      onUpdateStatus(order.id, "preparing")
    } else if (order.status === "preparing") {
      onUpdateStatus(order.id, "ready")
    } else if (order.status === "ready") {
      onUpdateStatus(order.id, "completed")
    }
  }

  const getButtonText = () => {
    if (order.status === "new") return "Start Preparing"
    if (order.status === "preparing") return "Mark as Ready"
    return "Complete"
  }

  return (
    <Card
      className={cn(
        "transition-all",
        order.status === "new" && "border-destructive/50 shadow-md animate-in fade-in duration-500",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold">{order.id}</CardTitle>
          <Badge
            variant={order.status === "new" ? "destructive" : order.status === "preparing" ? "default" : "secondary"}
            className={cn(order.status === "preparing" && "bg-accent text-accent-foreground")}
          >
            {order.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{getTimeSince(order.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{order.cashierName}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
            <div className="flex-1">
              <p className="font-medium leading-tight">{item.name}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
            </div>
            <Badge variant="outline" className="ml-2 shrink-0">
              x{item.quantity}
            </Badge>
          </div>
        ))}
      </CardContent>

      <CardFooter className="pt-3">
        <Button onClick={handleStatusChange} className="w-full" size="lg">
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  )
}
