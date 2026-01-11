"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { type MenuItem } from "@/lib/types"
import { api } from "@/lib/api"
import Image from "next/image"

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: 0,
    costOfGoods: 0,
    description: "",
    available: true,
    image: "",
  })

  // Category State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    icon: "🍽️",
  })

  // Review Dialog State
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedItemReviews, setSelectedItemReviews] = useState<{ name: string, reviews: any[] }>({ name: "", reviews: [] })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [fetchedItems, fetchedCategories] = await Promise.all([
      api.getMenuItems(),
      api.getCategories(),
    ])
    setItems(fetchedItems)
    setCategories(fetchedCategories)
  }

  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    // Find category ID based on name
    const category = categories.find(c => c.name === item.category)
    setFormData({
      name: item.name,
      categoryId: category ? category.id : "",
      price: item.price,
      costOfGoods: item.costOfGoods || 0,
      description: item.description || "",
      available: item.available,
      image: item.image || "",
    })
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      price: 0,
      costOfGoods: 0,
      description: "",
      available: true,
      image: "",
    })
    setIsDialogOpen(true)
  }

  const handleShowReviews = (item: MenuItem) => {
    setSelectedItemReviews({
      name: item.name,
      reviews: item.reviews || []
    })
    setIsReviewDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingItem) {
        const updatedItem = await api.updateMenuItem(editingItem.id, {
          name: formData.name,
          category: formData.categoryId,
          price: formData.price,
          costOfGoods: formData.costOfGoods,
          description: formData.description,
          available: formData.available,
          image: formData.image,
        } as any)

        if (updatedItem) {
          setItems((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)))
        }
      } else {
        const newItem = await api.createMenuItem({
          name: formData.name,
          category: formData.categoryId,
          price: formData.price,
          costOfGoods: formData.costOfGoods,
          description: formData.description,
          available: formData.available,
          image: formData.image || "/placeholder.svg",
        } as any)

        if (newItem) {
          setItems((prev) => [...prev, newItem])
        }
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to save item", error)
      alert(`Failed to save item: ${error.message || "Unknown error"}`)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size checks: Image must be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddCategory = () => {
    setCategoryFormData({ name: "", icon: "🍽️" })
    setIsCategoryDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    try {
      const newCategory = await api.createCategory(categoryFormData)
      if (newCategory) {
        setCategories(prev => [...prev, newCategory])
        setIsCategoryDialogOpen(false)
      }
    } catch (error) {
      console.error("Failed to save category", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const success = await api.deleteMenuItem(id)
      if (success) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage your restaurant menu items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const margin = item.price > 0 ? ((item.price - (item.costOfGoods || 0)) / item.price) * 100 : 0
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>${(item.costOfGoods || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={margin > 30 ? "text-emerald-600" : "text-amber-600"}>
                          {margin.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.available ? "default" : "secondary"}>
                          {item.available ? "Available" : "Out of Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="View Reviews" onClick={() => handleShowReviews(item)}>
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the menu item details" : "Add a new item to your menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Classic Burger"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value: string) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2 col-span-2">
                <Label>Item Image</Label>
                <div className="flex gap-4 items-start">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0 border">
                    {formData.image ? (
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Input
                      placeholder="Image URL (https://...)"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">- OR -</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-sm cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Sale Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost of Goods ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.costOfGoods}
                  onChange={(e) => setFormData({ ...formData, costOfGoods: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md text-xs">
              <p className="font-semibold mb-1">Profit Analysis:</p>
              <div className="flex justify-between">
                <span>Estimated Profit:</span>
                <span className="font-bold text-emerald-600">${(formData.price - formData.costOfGoods).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit Margin:</span>
                <span className="font-bold">{formData.price > 0 ? (((formData.price - formData.costOfGoods) / formData.price) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the item..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available (Live Update)</Label>
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, available: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reviews: {selectedItemReviews.name}</DialogTitle>
            <DialogDescription>Customer feedback history for this item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-auto">
            {selectedItemReviews.reviews.map((rev, i) => {
              const sentiment = rev.rating >= 4 ? "positive" : rev.rating >= 3 ? "neutral" : "negative"
              const colors = {
                positive: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800",
                neutral: "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800",
                negative: "bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800"
              }
              return (
                <div key={i} className={`p-3 border rounded-lg space-y-1 ${colors[sentiment]}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className={j < rev.rating ? "text-amber-500" : "text-slate-300"}>★</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(rev.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm italic">"{rev.comment}"</p>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category for your menu items</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="e.g., Desserts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon (Emoji)</Label>
              <Input
                id="cat-icon"
                value={categoryFormData.icon}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                placeholder="e.g., 🍦"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
