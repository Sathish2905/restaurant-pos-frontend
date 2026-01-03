"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Building2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { type Floor, type Table as TableType } from "@/lib/types"
import { api } from "@/lib/api"

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([])
  const [tables, setTables] = useState<TableType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchFloorsAndTables()
  }, [])

  const fetchFloorsAndTables = async () => {
    try {
      const [fetchedFloors, fetchedTables] = await Promise.all([
        api.getFloors(),
        api.getTables()
      ])
      setFloors(fetchedFloors)
      setTables(fetchedTables)
    } catch (error) {
      console.error("Failed to fetch floors", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const newFloor = await api.createFloor({
        name: formData.name,
        description: formData.description,
      })

      if (newFloor) {
        setFloors([...floors, newFloor])
        setIsAddDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to create floor", error)
    }
  }

  const handleEdit = async () => {
    if (editingFloor) {
      try {
        const updatedFloor = await api.updateFloor(editingFloor.id, {
          name: formData.name,
          description: formData.description,
        })

        if (updatedFloor) {
          setFloors(floors.map((f) => (f.id === editingFloor.id ? updatedFloor : f)))
          setEditingFloor(null)
          resetForm()
        }
      } catch (error) {
        console.error("Failed to update floor", error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    const tablesOnFloor = tables.filter((t) => t.floorId === id)
    if (tablesOnFloor.length > 0) {
      alert(`Cannot delete floor with ${tablesOnFloor.length} table(s). Please remove tables first.`)
      return
    }

    if (confirm("Are you sure you want to delete this floor?")) {
      try {
        const success = await api.deleteFloor(id)
        if (success) {
          setFloors(floors.filter((f) => f.id !== id))
        }
      } catch (error) {
        console.error("Failed to delete floor", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    })
  }

  const openEditDialog = (floor: Floor) => {
    setEditingFloor(floor)
    setFormData({
      name: floor.name,
      description: floor.description || "",
    })
  }

  const getTableCount = (floorId: string) => {
    return tables.filter((t) => t.floorId === floorId).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Floor Management</h1>
          <p className="text-muted-foreground">Manage restaurant floors and seating areas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Floor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Floor</DialogTitle>
              <DialogDescription>Create a new floor or seating area</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Floor Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ground Floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Main dining area"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Floor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Floor Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tables</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {floors.map((floor) => (
              <TableRow key={floor.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {floor.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{floor.description || "No description"}</TableCell>
                <TableCell>{getTableCount(floor.id)} tables</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(floor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Floor</DialogTitle>
                          <DialogDescription>Update floor information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Floor Name</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingFloor(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleEdit}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(floor.id)}>
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
  )
}
