"use client"

import { type Table, type Order, type Floor } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TableSelectorProps {
    tables: Table[]
    orders: Order[]
    floors: Floor[]
    selectedFloorId: string
    selectedTableId?: string
    onTableClick: (table: Table, order?: Order) => void
}

export function TableSelector({
    tables,
    orders,
    floors,
    selectedFloorId,
    selectedTableId,
    onTableClick,
}: TableSelectorProps) {
    const getTableOrder = (tableId: string) => {
        return orders.find((order) => order.tableId === tableId && order.status !== "completed")
    }

    const getStatusColor = (status: Order["status"]) => {
        switch (status) {
            case "new":
                return "bg-red-500"
            case "preparing":
                return "bg-yellow-500"
            case "ready":
                return "bg-green-500"
            case "completed":
                return "bg-blue-500"
            default:
                return "bg-gray-500"
        }
    }

    const getPaymentStatusColor = (status: Order["paymentStatus"]) => {
        switch (status) {
            case "paid":
                return "text-green-600 bg-green-100"
            case "unpaid":
                return "text-red-600 bg-red-100"
            case "partial":
                return "text-yellow-600 bg-yellow-100"
            default:
                return "text-gray-600 bg-gray-100"
        }
    }

    const floor = floors.find((f) => f.id === selectedFloorId)

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tables
                .filter((t) => t.floorId === selectedFloorId)
                .map((table) => {
                    const order = getTableOrder(table.id)
                    const hasOrder = !!order

                    return (
                        <Card
                            key={table.id}
                            className={cn(
                                "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                                (hasOrder || selectedTableId === table.id) && "border-2 border-primary",
                                selectedTableId === table.id && "ring-2 ring-primary ring-offset-1",
                            )}
                            onClick={() => onTableClick(table, order)}
                        >
                            <CardContent className="p-4">
                                {/* Table Number Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                                        T{table.number}
                                    </Badge>
                                    <Badge
                                        variant={table.status === "available" ? "default" : "destructive"}
                                        className={cn(
                                            "text-xs",
                                            table.status === "available" && "bg-green-500",
                                            table.status === "reserved" && "bg-orange-500",
                                        )}
                                    >
                                        {table.status}
                                    </Badge>
                                </div>

                                {/* Capacity */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                    <span>{table.capacity} seats</span>
                                    <span>•</span>
                                    <span className="capitalize">{table.shape}</span>
                                </div>

                                {/* Order Status */}
                                {hasOrder && order ? (
                                    <div className="space-y-2 border-t pt-3 mt-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", getStatusColor(order.status))} />
                                            <span className="text-xs font-medium capitalize">{order.status}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="text-sm font-semibold">${order.total.toFixed(2)}</div>
                                        <Badge className={cn("text-xs", getPaymentStatusColor(order.paymentStatus))}>
                                            {order.paymentStatus}
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 border-t pt-3 mt-3">
                                        <p className="text-xs text-muted-foreground mb-2">No active order</p>
                                        <div className="text-primary text-xs font-medium">Select to start</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
        </div>
    )
}
