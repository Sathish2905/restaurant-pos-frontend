"use client"

import { Flame, Info, ChevronUp, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Order } from "@/lib/types"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface MiseEnPlaceFooterProps {
    orders: Order[]
}

export function MiseEnPlaceFooter({ orders }: MiseEnPlaceFooterProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Aggregate items that are not ready yet
    const cookingItems = orders.reduce((acc, order) => {
        if (order.status === "completed") return acc

        order.items.forEach(item => {
            if (!item.isReady) {
                acc[item.name] = (acc[item.name] || 0) + item.quantity
            }
        })
        return acc
    }, {} as Record<string, number>)

    const items = Object.entries(cookingItems).sort((a, b) => b[1] - a[1])

    if (items.length === 0) return null

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
            isExpanded ? "h-[300px]" : "h-12"
        )}>
            <div className="h-full bg-slate-950 border-t border-primary/20 shadow-2xl flex flex-col">
                {/* Toggle Head */}
                <div
                    className="h-12 px-6 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors shrink-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
                            </div>
                            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Mise en Place</span>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-800" />
                        <div className="flex items-center gap-2 overflow-hidden max-w-[60vw]">
                            {items.slice(0, 5).map(([name, count]) => (
                                <Badge key={name} variant="outline" className="text-[10px] border-slate-700 text-slate-300 font-bold whitespace-nowrap">
                                    {name}: {count}
                                </Badge>
                            ))}
                            {items.length > 5 && (
                                <span className="text-[10px] text-slate-500 font-bold">+{items.length - 5} more</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-primary font-black text-[10px] bg-primary/10 px-2 py-1 rounded">
                            <Info className="h-3 w-3" />
                            AGGREGATED ACTIVE ITEMS
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
                    </div>
                </div>

                {/* Expanded Grid */}
                <div className="flex-1 overflow-auto p-6 pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {items.map(([name, count]) => (
                            <div key={name} className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center gap-1 group hover:border-orange-500/50 transition-colors">
                                <span className="text-2xl font-black text-orange-500 group-hover:scale-110 transition-transform">{count}</span>
                                <span className="text-[10px] text-slate-400 font-black text-center uppercase leading-tight">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
