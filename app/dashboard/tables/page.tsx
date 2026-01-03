"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { type Table as TableType, type Floor } from "@/lib/types"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function TablesPage() {
  const [tables, setTables] = useState<TableType[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<TableType | null>(null)
  const [formData, setFormData] = useState({
    number: "",
    floorId: "",
    capacity: "",
    status: "available" as TableType["status"],
    shape: "square" as TableType["shape"],
  })

  useEffect(() => {
    fetchTablesAndFloors()
  }, [])

  const fetchTablesAndFloors = async () => {
    try {
      const [fetchedTables, fetchedFloors] = await Promise.all([
        api.getTables(),
        api.getFloors()
      ])
      setTables(fetchedTables)
      setFloors(fetchedFloors)
    } catch (error) {
      console.error("Failed to fetch tables", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.floorId || !formData.number || !formData.capacity) {
      alert("Please fill in all required fields")
      return
    }

    if (Number(formData.capacity) < 1) {
      alert("Capacity must be at least 1")
      return
    }

    try {
      // Backend expects 'floor' instead of 'floorId'
      const payload: any = {
        number: Number(formData.number),
        floor: formData.floorId,
        capacity: Number(formData.capacity),
        status: formData.status,
        shape: formData.shape,
        position: { x: 100, y: 100 },
      }

      const newTable = await api.createTable(payload)

      if (newTable) {
        setTables([...tables, newTable])
        setIsAddDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to create table", error)
    }
  }

  const handleEdit = async () => {
    if (editingTable) {
      try {
        const payload: any = {
          number: Number(formData.number),
          floor: formData.floorId,
          capacity: Number(formData.capacity) || 1, // ensure >= 1
          status: formData.status,
          shape: formData.shape,
        }

        const updatedTable = await api.updateTable(editingTable.id, payload)

        if (updatedTable) {
          setTables(tables.map((t) => (t.id === editingTable.id ? updatedTable : t)))
          setEditingTable(null)
          resetForm()
        }
      } catch (error) {
        console.error("Failed to update table", error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await api.deleteTable(id)
      if (success) {
        setTables(tables.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete table", error)
    }
  }

  const resetForm = () => {
    setFormData({
      number: "",
      floorId: "",
      capacity: "",
      status: "available",
      shape: "square",
    })
  }

  const openEditDialog = (table: TableType) => {
    setEditingTable(table)
    setFormData({
      number: String(table.number),
      floorId: table.floorId,
      capacity: String(table.capacity),
      status: table.status,
      shape: table.shape,
    })
  }

  const getStatusColor = (status: TableType["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "occupied":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "reserved":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    }
  }

  const getFloorName = (floorId: string) => {
    return floors.find((f) => f.id === floorId)?.name || "Unknown"
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
            <p className="text-muted-foreground">Manage restaurant tables and seating</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>Create a new table in your restaurant</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Table Number</Label>
                  <Input
                    id="number"
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Select
                    value={formData.floorId}
                    onValueChange={(value: string) => setFormData({ ...formData, floorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shape">Table Shape</Label>
                  <Select
                    value={formData.shape}
                    onValueChange={(value: TableType["shape"]) => setFormData({ ...formData, shape: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle (2-4 seats)</SelectItem>
                      <SelectItem value="square">Square (4 seats)</SelectItem>
                      <SelectItem value="rectangle">Rectangle (6-8 seats)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: TableType["status"]) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add Table</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Number</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Shape</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      Table {table.number}
                    </div>
                  </TableCell>
                  <TableCell>{getFloorName(table.floorId)}</TableCell>
                  <TableCell>{table.capacity} guests</TableCell>
                  <TableCell className="capitalize">{table.shape}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", getStatusColor(table.status))}>
                      {table.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(table)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Table</DialogTitle>
                            <DialogDescription>Update table information</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-number">Table Number</Label>
                              <Input
                                id="edit-number"
                                type="number"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-floor">Floor</Label>
                              <Select
                                value={formData.floorId}
                                onValueChange={(value: string) => setFormData({ ...formData, floorId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {floors.map((floor) => (
                                    <SelectItem key={floor.id} value={floor.id}>
                                      {floor.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-capacity">Capacity</Label>
                              <Input
                                id="edit-capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-shape">Table Shape</Label>
                              <Select
                                value={formData.shape}
                                onValueChange={(value: TableType["shape"]) => setFormData({ ...formData, shape: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="circle">Circle</SelectItem>
                                  <SelectItem value="square">Square</SelectItem>
                                  <SelectItem value="rectangle">Rectangle</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value: TableType["status"]) =>
                                  setFormData({ ...formData, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="occupied">Occupied</SelectItem>
                                  <SelectItem value="reserved">Reserved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingTable(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEdit}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(table.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
