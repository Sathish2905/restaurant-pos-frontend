"use client"

import { useState } from "react"
import { UtensilsCrossed, Users, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Table, type Floor } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TableSelectionProps {
  selectedTable: Table | null
  onSelectTable: (table: Table | null) => void
  tables: Table[]
  floors: Floor[]
}

export function TableSelection({ selectedTable, onSelectTable, tables, floors }: TableSelectionProps) {
  const [open, setOpen] = useState(false)

  const handleTableSelect = (table: Table) => {
    if (table.status === "available") {
      onSelectTable(table)
      setOpen(false)
    }
  }

  const getStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "occupied":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "reserved":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-3 justify-start bg-transparent" size="sm">
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          {selectedTable ? (
            <>
              Table {selectedTable.number}
              <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-500" />
            </>
          ) : (
            "Select Table"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Table</DialogTitle>
          <DialogDescription>Choose a table for this order</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={floors[0]?.id} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${floors.length || 1}, 1fr)` }}>
            {floors.map((floor) => (
              <TabsTrigger key={floor.id} value={floor.id}>
                {floor.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {floors.map((floor) => {
            const floorTables = tables.filter((t) => t.floorId === floor.id)
            return (
              <TabsContent key={floor.id} value={floor.id} className="space-y-4">
                {floor.description && <p className="text-sm text-muted-foreground">{floor.description}</p>}
                <div className="grid grid-cols-4 gap-3">
                  {floorTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      disabled={table.status !== "available"}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all hover:scale-105",
                        table.status === "available"
                          ? "border-border hover:border-primary cursor-pointer"
                          : "border-border opacity-50 cursor-not-allowed",
                        selectedTable?.id === table.id && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-lg">Table {table.number}</div>
                        {selectedTable?.id === table.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Users className="h-3 w-3" />
                        <span>{table.capacity}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs capitalize", getStatusColor(table.status))}>
                        {table.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
