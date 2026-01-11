"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react"
import { type User, type UserRole, type WasteEntry } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Calendar as CalendarIcon,
  ShieldCheck,
  TrendingUp,
  Award,
  Flame
} from "lucide-react"

export function StaffManagementContent() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("members")

  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [wasteLogs, setWasteLogs] = useState<WasteEntry[]>([])
  const [staffStats, setStaffStats] = useState({
    onDuty: 0,
    late: 0,
    onLeave: 0,
    leaveRequests: [] as { name: string; role: string; when: string; status: string }[]
  })

  // Waste Dialog State
  const [isWasteDialogOpen, setIsWasteDialogOpen] = useState(false)
  const [wasteFormData, setWasteFormData] = useState({
    itemId: "",
    itemName: "",
    quantity: 1,
    reason: "Preparation Error",
    cost: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedStaff, fetchedPerf, fetchedAtt, fetchedWaste, fetchedStats] = await Promise.all([
          api.getUsers(),
          api.getStaffPerformance(),
          api.getStaffAttendance(),
          api.getWasteLogs(),
          api.getStaffStats()
        ])
        setStaff(fetchedStaff)
        setPerformanceData(fetchedPerf)
        setAttendanceData(fetchedAtt)
        setWasteLogs(fetchedWaste)
        setStaffStats(fetchedStats)
      } catch (error) {
        console.error("Failed to fetch operations data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cashier" as UserRole,
    password: "",
    status: "active" as "active" | "inactive",
  })

  const permissionsMatrix = [
    { feature: "Orders", admin: true, chef: true, cashier: true },
    { feature: "Menu Edit", admin: true, chef: false, cashier: false },
    { feature: "Financials", admin: true, chef: false, cashier: false },
    { feature: "Staff Management", admin: true, chef: false, cashier: false },
    { feature: "Kitchen Display", admin: true, chef: true, cashier: false },
  ]

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (member: User) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      password: "",
      status: member.status,
    })
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingStaff(null)
    setFormData({
      name: "",
      email: "",
      role: "cashier",
      password: "",
      status: "active",
    })
    setIsDialogOpen(true)
  }

  const handleSaveWaste = async () => {
    try {
      const log = await api.createWasteLog({
        ...wasteFormData,
        loggedBy: user?.name || "Admin",
        date: new Date()
      })
      if (log) {
        setWasteLogs([log, ...wasteLogs])
        setIsWasteDialogOpen(false)
        setWasteFormData({
          itemId: "",
          itemName: "",
          quantity: 1,
          reason: "Preparation Error",
          cost: 0
        })
      }
    } catch (error) {
      console.error("Failed to log waste", error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (editingStaff) {
        // Update existing staff
        const updatedUser = await api.updateUser(editingStaff.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          ...(formData.password && { password: formData.password }),
        })

        if (updatedUser) {
          setStaff((prev) =>
            prev.map((member) =>
              member.id === editingStaff.id ? updatedUser : member,
            ),
          )
        }
      } else {
        // Create new staff
        if (!formData.password) {
          alert("Password is required for new staff members")
          setIsLoading(false)
          return
        }
        const newUser = await api.createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          password: formData.password,
        })

        if (newUser) {
          setStaff((prev) => [...prev, newUser])
        }
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to save staff member", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      setIsLoading(true)
      try {
        const success = await api.deleteUser(id)
        if (success) {
          setStaff((prev) => prev.filter((member) => member.id !== id))
        }
      } catch (error) {
        console.error("Failed to delete staff member", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === "admin") return "default"
    if (role === "cashier") return "secondary"
    return "outline"
  }

  const topWasteReason = useMemo(() => {
    if (wasteLogs.length === 0) return "N/A"
    const reasons: Record<string, number> = {}
    wasteLogs.forEach(log => {
      reasons[log.reason] = (reasons[log.reason] || 0) + 1
    })
    return Object.entries(reasons).sort((a, b) => b[1] - a[1])[0][0]
  }, [wasteLogs])

  if (isLoading && staff.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff & Operations</h1>
            <p className="text-muted-foreground">Monitor performance, attendance and access.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff Member
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border">
            <TabsTrigger value="members" className="data-[state=active]:bg-background">
              <Users className="h-4 w-4 mr-2" /> Staff Directory
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4 mr-2" /> Performance
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-background">
              <CalendarIcon className="h-4 w-4 mr-2" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-background">
              <ShieldCheck className="h-4 w-4 mr-2" /> Access Control
            </TabsTrigger>
            <TabsTrigger value="waste" className="data-[state=active]:bg-background">
              <Flame className="h-4 w-4 mr-2" /> Waste Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member) => (
                      <TableRow key={member.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                              <span className="text-sm font-medium text-primary">{member.name.charAt(0)}</span>
                            </div>
                            <p className="font-semibold">{member.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize px-3 py-1">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "destructive"} className="capitalize">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceData.map(chef => (
                <Card key={chef.name} className="border-none shadow-md overflow-hidden relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      {chef.name}
                      <Award className="h-5 w-5 text-amber-500" />
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">{chef.orders} Orders Handled</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Prep Time</p>
                        <p className="text-2xl font-bold">{chef.prepTime}m</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="text-xl font-bold text-primary">{chef.rating}★</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: `${(chef.rating / 5) * 100}%` }}></div>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Staff Productivity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-md">
              <CardHeader>
                <CardTitle>Roster Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar mode="multiple" className="rounded-md border shadow w-full flex justify-center py-8" />
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">On Duty</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-700">{staffStats.onDuty}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="font-medium">Late Comers</span>
                  </div>
                  <span className="text-xl font-bold text-amber-700">{staffStats.late}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span className="font-medium">On Leave</span>
                  </div>
                  <span className="text-xl font-bold text-rose-700">{staffStats.onLeave}</span>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Leave Requests</h4>
                  <div className="space-y-2">
                    {staffStats.leaveRequests.length > 0 ? staffStats.leaveRequests.map((req, i) => (
                      <div key={i} className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded flex justify-between items-center">
                        <span>{req.name} ({req.role}) - {req.when}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{req.status}</Badge>
                      </div>
                    )) : (
                      <p className="text-xs text-muted-foreground text-center">No pending requests.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Role Access Matrix</CardTitle>
                <CardDescription>Manage what each role can see and do.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Feature Area</TableHead>
                      <TableHead className="text-center">Super Admin</TableHead>
                      <TableHead className="text-center">Kitchen</TableHead>
                      <TableHead className="text-center">Staff/Cashier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionsMatrix.map((item) => (
                      <TableRow key={item.feature}>
                        <TableCell className="font-medium">{item.feature}</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          {item.chef ? <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" /> : <XCircle className="h-5 w-5 text-slate-300 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.cashier ? <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" /> : <XCircle className="h-5 w-5 text-slate-300 mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-8 flex justify-end">
                  <Button variant="outline" className="mr-4">Reset Defaults</Button>
                  <Button disabled>Save Permissions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waste" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-rose-50 dark:bg-rose-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-rose-600">Total Waste (Today)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-rose-700">${wasteLogs.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Items Wasted</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-700">{wasteLogs.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Top Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{topWasteReason}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Waste Logs</CardTitle>
                  <CardDescription>Items discarded due to errors or quality issues.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsWasteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Log Waste
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Cost Impact</TableHead>
                      <TableHead>Logged By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wasteLogs.map((log, index) => (
                      <TableRow key={log.id || `waste-${index}`}>
                        <TableCell className="font-medium">{log.itemName}</TableCell>
                        <TableCell>{log.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal bg-slate-50">
                            {log.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-rose-600 font-semibold">-${log.cost.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {typeof log.loggedBy === 'object' ? (log.loggedBy as any).name : log.loggedBy}
                        </TableCell>
                      </TableRow>
                    ))}
                    {wasteLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No waste logged for this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
            <DialogDescription>
              {editingStaff ? "Update the staff member details" : "Fill in the details for the new staff member"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., john@restaurant.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editingStaff ? "New Password (optional)" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingStaff ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWasteDialogOpen} onOpenChange={setIsWasteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Food Waste</DialogTitle>
            <DialogDescription>Track items discarded due to errors or waste.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={wasteFormData.itemName}
                onChange={(e) => setWasteFormData({ ...wasteFormData, itemName: e.target.value })}
                placeholder="e.g., Spicy Ramen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={wasteFormData.quantity}
                  onChange={(e) => setWasteFormData({ ...wasteFormData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cost Impact ($)</Label>
                <Input
                  type="number"
                  value={wasteFormData.cost}
                  onChange={(e) => setWasteFormData({ ...wasteFormData, cost: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select
                value={wasteFormData.reason}
                onValueChange={(val) => setWasteFormData({ ...wasteFormData, reason: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preparation Error">Preparation Error</SelectItem>
                  <SelectItem value="Wrong Order">Wrong Order</SelectItem>
                  <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWasteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWaste} className="bg-rose-600 hover:bg-rose-700">Log Waste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
