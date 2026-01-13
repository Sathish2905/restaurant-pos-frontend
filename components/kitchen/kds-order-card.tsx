"use client"

import { useState, useEffect } from "react"
import { Clock, User, Timer, MessageSquare, Flame, CheckCircle2, PlayCircle, Star, PhoneForwarded } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { type Order, type OrderStatus, type CartItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface KDSOrderCardProps {
    order: Order
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void
    onUpdateItemStatus?: (orderId: string, itemId: string, isReady: boolean) => void
    onPingWaiter?: (orderId: string) => void
}

export function KDSOrderCard({ order, onUpdateStatus, onUpdateItemStatus, onPingWaiter }: KDSOrderCardProps) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
            setElapsed(minutes)
        }, 10000) // Update every 10s

        const initial = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
        setElapsed(initial)

        return () => clearInterval(timer)
    }, [order.createdAt])

    // Urgency coloring: White (<10) -> Amber (10-20) -> Red (>20)
    const getUrgencyClass = () => {
        if (order.status === "ready" || order.status === "completed") return "bg-card border-primary/20"
        if (elapsed > 20) return "bg-red-950/20 border-red-500/50 shadow-red-900/10"
        if (elapsed > 10) return "bg-amber-950/20 border-amber-500/50 shadow-amber-900/10"
        return "bg-card border-border"
    }

    const getTimeColor = () => {
        if (elapsed > 20) return "text-red-500"
        if (elapsed > 10) return "text-amber-500"
        return "text-muted-foreground"
    }

    const readyCount = order.items.filter(i => i.isReady).length
    const totalItems = order.items.length
    const progress = (readyCount / totalItems) * 100

    const handleItemToggle = (itemId: string, currentStatus?: boolean) => {
        if (onUpdateItemStatus) {
            onUpdateItemStatus(order.id, itemId, !currentStatus)
        }
    }

    return (
        <Card className={cn("transition-all duration-500 border-2 overflow-hidden flex flex-col h-full", getUrgencyClass())}>
            <CardHeader className="pb-2 bg-muted/30">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tighter">#{order.id.slice(-4)}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                {order.type}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Timer className={cn("h-3 w-3", getTimeColor())} />
                            <span className={getTimeColor()}>{elapsed}m active</span>
                            <span className="opacity-50">•</span>
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[80px]">{order.cashierName}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge
                            variant={order.status === "new" ? "destructive" : order.status === "preparing" ? "default" : "secondary"}
                            className="font-bold border-none"
                        >
                            {order.status}
                        </Badge>
                        {order.tableNumber && (
                            <div className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-black">
                                T-{order.tableNumber}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar for Items */}
                <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider opacity-60">
                        <span>Progress</span>
                        <span>{readyCount}/{totalItems} Ready</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-auto max-h-[400px]">
                {order.items.map((item, index) => (
                    <div
                        key={`${item.id}-${index}`}
                        className={cn(
                            "group relative flex items-start gap-3 p-4 border-b last:border-0 transition-colors",
                            item.isReady ? "bg-primary/5 opacity-60" : "hover:bg-muted/50"
                        )}
                    >
                        {/* Ready Toggle */}
                        <button
                            onClick={() => handleItemToggle(item.id, item.isReady)}
                            className={cn(
                                "mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                item.isReady
                                    ? "bg-primary border-primary text-primary-foreground scale-110"
                                    : "border-muted-foreground/30 hover:border-primary/50"
                            )}
                        >
                            {item.isReady && <CheckCircle2 className="h-4 w-4" />}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className={cn(
                                    "font-bold leading-tight truncate",
                                    item.isReady && "line-through"
                                )}>
                                    {item.name}
                                </p>
                                <span className="text-sm font-black px-1.5 py-0.5 bg-muted rounded">
                                    x{item.quantity}
                                </span>
                            </div>

                            {item.notes && (
                                <div className="flex items-start gap-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-500 font-medium italic">
                                    <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span>{item.notes}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                                {item.platingMediaUrl && (
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1 hover:bg-primary/10 hover:text-primary">
                                        <PlayCircle className="h-3 w-3" />
                                        How to Plate
                                    </Button>
                                )}
                                {item.isFavoriteKitchen && (
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                )}
                            </div>
                        </div>

                        {/* Quick Action Overlay for Item (Only if not ready) */}
                        {!item.isReady && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Badge className="bg-primary hover:bg-primary transition-none">PREPARING</Badge>
                            </div>
                        )}
                    </div>
                ))}
                {order.notes && (
                    <div className="px-4 py-3 bg-blue-500/5 border-t border-blue-500/10 text-xs text-blue-500 font-medium">
                        <span className="font-bold flex items-center gap-1 mb-1"><MessageSquare className="h-3 w-3" /> Order Note:</span>
                        {order.notes}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 bg-muted/30 gap-2">
                <div className="w-full space-y-2">
                    {order.status !== "ready" && (
                        <Button
                            onClick={() => onUpdateStatus(order.id, order.status === "new" ? "preparing" : "ready")}
                            className="w-full font-bold h-12"
                            size="lg"
                        >
                            {order.status === "new" ? (
                                <><Flame className="mr-2 h-4 w-4" /> Fire Order</>
                            ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4" /> All Items Ready</>
                            )}
                        </Button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] font-bold h-9 gap-1"
                            onClick={() => onPingWaiter?.(order.id)}
                        >
                            <PhoneForwarded className="h-3 w-3" /> PING WAITER
                        </Button>
                        {order.status === "ready" && (
                            <Button
                                onClick={() => onUpdateStatus(order.id, "completed")}
                                className="text-[10px] font-bold h-9"
                            >
                                DISPATCH
                            </Button>
                        )}
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
