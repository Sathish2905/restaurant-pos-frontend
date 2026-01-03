"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, Phone, Mail, MessageSquare, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Table, type Floor, type MenuItem } from "@/lib/types"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function ReservationsPage() {
  const [step, setStep] = useState<"info" | "table" | "menu" | "confirm">("info")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [selectedMenuItems, setSelectedMenuItems] = useState<Map<string, number>>(new Map())

  // Data state
  const [floors, setFloors] = useState<Floor[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    date: "",
    time: "",
    partySize: "",
    specialRequests: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedFloors, fetchedTables, fetchedMenuItems] = await Promise.all([
          api.getFloors(),
          api.getTables(),
          api.getMenuItems()
        ])
        setFloors(fetchedFloors)
        setTables(fetchedTables)
        setMenuItems(fetchedMenuItems)
      } catch (error) {
        console.error("Failed to fetch reservation data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleTableSelect = (table: Table, floor: Floor) => {
    setSelectedTable(table)
    setSelectedFloor(floor)
  }

  const addMenuItem = (item: MenuItem) => {
    const newMap = new Map(selectedMenuItems)
    newMap.set(item.id, (newMap.get(item.id) || 0) + 1)
    setSelectedMenuItems(newMap)
  }

  const removeMenuItem = (itemId: string) => {
    const newMap = new Map(selectedMenuItems)
    const current = newMap.get(itemId) || 0
    if (current > 1) {
      newMap.set(itemId, current - 1)
    } else {
      newMap.delete(itemId)
    }
    setSelectedMenuItems(newMap)
  }

  const getTotalAmount = () => {
    let total = 0
    selectedMenuItems.forEach((quantity, itemId) => {
      const item = menuItems.find((i) => i.id === itemId)
      if (item) total += item.price * quantity
    })
    return total
  }

  const regularFloors = floors.filter((f) => f.type === "floor" || !f.type)
  const partyHalls = floors.filter((f) => f.type === "party-hall")

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Table Reservation</h1>
          <p className="text-sm text-muted-foreground">Reserve your table and pre-order menu items</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[
            { key: "info", label: "Customer Info" },
            { key: "table", label: "Select Table" },
            { key: "menu", label: "Pre-order Menu" },
            { key: "confirm", label: "Confirm" },
          ].map((s, idx) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  step === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {idx + 1}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">{s.label}</span>
              {idx < 3 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Customer Info */}
        {step === "info" && (
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Please provide your details for the reservation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partySize">Party Size *</Label>
                  <Input
                    id="partySize"
                    type="number"
                    min="1"
                    placeholder="2"
                    value={formData.partySize}
                    onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requests">Special Requests (Optional)</Label>
                <Textarea
                  id="requests"
                  placeholder="Any dietary restrictions, celebrations, or special requirements..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => setStep("table")}
                disabled={
                  !formData.customerName ||
                  !formData.customerPhone ||
                  !formData.date ||
                  !formData.time ||
                  !formData.partySize
                }
              >
                Continue to Table Selection
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Table Selection */}
        {step === "table" && (
          <div className="space-y-6">
            {/* Regular Floors */}
            <div>
              <h2 className="text-xl font-bold mb-4">Regular Dining Tables</h2>
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {regularFloors.map((floor) => {
                  const floorTables = tables.filter((t) => t.floorId === floor.id)
                  return (
                    <Card key={floor.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{floor.name}</CardTitle>
                        <CardDescription>{floor.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {floorTables.map((table) => (
                            <button
                              key={table.id}
                              onClick={() => handleTableSelect(table, floor)}
                              disabled={table.status !== "available"}
                              className={cn(
                                "flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
                                table.status !== "available" && "cursor-not-allowed opacity-50",
                                selectedTable?.id === table.id ? "border-primary bg-primary/5" : "hover:bg-muted",
                              )}
                            >
                              <div>
                                <div className="font-medium">Table {table.number}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {table.capacity} seats
                                </div>
                              </div>
                              <Badge
                                variant={
                                  table.status === "available"
                                    ? "default"
                                    : table.status === "occupied"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {table.status}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Party Halls */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Party Halls & Event Spaces
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {partyHalls.map((floor) => {
                  const hallTables = tables.filter((t) => t.floorId === floor.id)
                  return (
                    <Card key={floor.id} className="border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">{floor.name}</CardTitle>
                        <CardDescription>{floor.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {hallTables.map((table) => (
                            <button
                              key={table.id}
                              onClick={() => handleTableSelect(table, floor)}
                              disabled={table.status !== "available"}
                              className={cn(
                                "flex items-center justify-between rounded-lg border p-4 text-left transition-colors",
                                table.status !== "available" && "cursor-not-allowed opacity-50",
                                selectedTable?.id === table.id ? "border-primary bg-primary/5" : "hover:bg-muted",
                              )}
                            >
                              <div>
                                <div className="font-medium">Setup {table.number}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Up to {table.capacity} guests
                                </div>
                              </div>
                              <Badge
                                variant={
                                  table.status === "available"
                                    ? "default"
                                    : table.status === "occupied"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {table.status}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("menu")} disabled={!selectedTable} className="flex-1">
                Continue to Menu
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Menu Pre-order */}
        {step === "menu" && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pre-order Menu Items (Optional)</CardTitle>
                <CardDescription>Select menu items you'd like to pre-order for your reservation</CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  {menuItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="aspect-video relative mb-3 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
                          <Button size="sm" onClick={() => addMenuItem(item)}>
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Pre-order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedMenuItems.size === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No items added yet. Browse the menu to add items.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Array.from(selectedMenuItems.entries()).map(([itemId, quantity]) => {
                          const item = menuItems.find((i) => i.id === itemId)
                          if (!item) return null
                          return (
                            <div key={itemId} className="flex items-center justify-between text-sm">
                              <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-muted-foreground">
                                  ${item.price.toFixed(2)} × {quantity}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">${(item.price * quantity).toFixed(2)}</span>
                                <Button size="sm" variant="ghost" onClick={() => removeMenuItem(itemId)}>
                                  ×
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep("table")} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("confirm")} className="flex-1">
                Continue to Confirmation
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === "confirm" && selectedTable && selectedFloor && (
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle>Confirm Your Reservation</CardTitle>
              <CardDescription>Please review your reservation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.customerPhone}</span>
                  </div>
                  {formData.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.customerEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.partySize} guests</span>
                  </div>
                  {formData.specialRequests && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{formData.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Table Details</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {selectedFloor.type === "party-hall" ? "Setup" : "Table"} {selectedTable.number}
                        </div>
                        <div className="text-sm text-muted-foreground">{selectedFloor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Capacity: {selectedTable.capacity} {selectedFloor.type === "party-hall" ? "guests" : "seats"}
                        </div>
                      </div>
                      <Badge>Reserved</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedMenuItems.size > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Pre-ordered Menu</h3>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      {Array.from(selectedMenuItems.entries()).map(([itemId, quantity]) => {
                        const item = menuItems.find((i) => i.id === itemId)
                        if (!item) return null
                        return (
                          <div key={itemId} className="flex justify-between text-sm">
                            <span>
                              {item.name} × {quantity}
                            </span>
                            <span className="font-medium">${(item.price * quantity).toFixed(2)}</span>
                          </div>
                        )
                      })}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("menu")} className="flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    alert("Reservation confirmed! You will receive a confirmation via phone/email.")
                    // Reset form
                    setStep("info")
                    setSelectedTable(null)
                    setSelectedFloor(null)
                    setSelectedMenuItems(new Map())
                    setFormData({
                      customerName: "",
                      customerPhone: "",
                      customerEmail: "",
                      date: "",
                      time: "",
                      partySize: "",
                      specialRequests: "",
                    })
                  }}
                >
                  Confirm Reservation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
