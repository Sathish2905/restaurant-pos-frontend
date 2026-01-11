"use client"

import { useState, useMemo } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Download,
    Plus,
    Trash2,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    Filter
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Expense } from "@/lib/types"
import { api } from "@/lib/api"
import { useEffect } from "react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function FinancialsContent() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [allOrders, setAllOrders] = useState<any[]>([]) // Store all orders for local filtering
    const [isLoading, setIsLoading] = useState(true)
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        category: "others",
        amount: 0,
        description: ""
    })

    const [dateRange, setDateRange] = useState("this-month")

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            // Fetch everything once
            const [expensesData, ordersData] = await Promise.all([
                api.getExpenses(),
                api.getOrders()
            ])
            setExpenses(expensesData)
            setAllOrders(ordersData)
            setIsLoading(false)
        }
        fetchData()
    }, [])

    // Filter data locally based on dateRange
    const filteredData = useMemo(() => {
        const now = new Date()
        let start = new Date()
        let end = new Date()

        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)

        if (dateRange === "today") {
            // start is already today 00:00
        } else if (dateRange === "this-week") {
            const day = now.getDay() || 7
            if (day !== 1) start.setHours(-24 * (day - 1))
        } else if (dateRange === "this-month") {
            start.setDate(1)
        } else if (dateRange === "last-month") {
            start.setMonth(start.getMonth() - 1)
            start.setDate(1)
            end.setDate(0) // Last day of previous month
        } else if (dateRange === "this-year") {
            start.setMonth(0, 1)
        }

        const filteredOrders = allOrders.filter(o => {
            const d = new Date(o.createdAt)
            return d >= start && d <= end && o.status === 'completed'
        })

        const filteredExpenses = expenses.filter(e => {
            const d = new Date(e.date)
            return d >= start && d <= end
        })

        const revenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

        // Generate chart data (grouped by day for month/week, by month for year)
        const chartMap = new Map<string, { revenue: number, expenses: number }>()

        // Helper to populate chart
        const addToChart = (date: any, amount: number, type: 'revenue' | 'expenses') => {
            const d = new Date(date)
            let key = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
            if (dateRange === 'today') key = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            if (dateRange === 'this-year') key = d.toLocaleDateString('en-US', { month: 'short' })

            if (!chartMap.has(key)) chartMap.set(key, { revenue: 0, expenses: 0 })
            const entry = chartMap.get(key)!
            entry[type] += amount
        }

        filteredOrders.forEach(o => addToChart(o.createdAt, o.total || 0, 'revenue'))
        filteredExpenses.forEach(e => addToChart(e.date, e.amount, 'expenses'))

        // Fill in missing days if needed (simplified: just sorting existing keys)
        // A robust solution would fill gaps, but this suffices for "working filter"
        const chartData = Array.from(chartMap.entries()).map(([name, data]) => ({
            name,
            ...data
        }))

        return { revenue, totalExpenses, chartData, filteredExpenses }
    }, [dateRange, allOrders, expenses])


    // Real Revenue from Summary
    const revenue = filteredData.revenue
    const totalExpenses = filteredData.totalExpenses
    const netProfit = revenue - totalExpenses
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    const handleAddExpense = async () => {
        if (newExpense.amount && newExpense.category) {
            const expense = await api.createExpense({
                category: newExpense.category,
                amount: Number(newExpense.amount),
                description: newExpense.description || "",
                date: new Date()
            })
            if (expense) {
                setExpenses([expense, ...expenses])
                setNewExpense({ category: "others", amount: 0, description: "" })
            }
        }
    }

    const handleDeleteExpense = async (id: string) => {
        const success = await api.deleteExpense(id)
        if (success) {
            setExpenses(expenses.filter(e => e.id !== id))
        }
    }

    // Chart Data
    const pieData = useMemo(() => {
        const categories: Record<string, number> = {}
        // Use filtered expenses for the pie chart too
        filteredData.filteredExpenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount
        })
        return Object.entries(categories).map(([name, value]) => ({ name, value }))
    }, [filteredData.filteredExpenses])

    const barData = filteredData.chartData

    return (
        <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financials & Revenue</h1>
                    <p className="text-muted-foreground mt-1">Deep analytics and P&L tracking.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="this-week">This Week</SelectItem>
                            <SelectItem value="this-month">This Month</SelectItem>
                            <SelectItem value="last-month">Last Month</SelectItem>
                            <SelectItem value="this-year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export center
                    </Button>
                </div>
            </div>

            {/* P&L Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-emerald-50 dark:bg-emerald-900/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">${revenue.toLocaleString()}</div>
                        <p className="text-xs text-emerald-700 mt-1">↑ 8% vs last month</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-rose-50 dark:bg-rose-900/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-400">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-rose-900 dark:text-rose-300">${totalExpenses.toLocaleString()}</div>
                        <p className="text-xs text-rose-700 mt-1">↓ 2% vs last month</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">${netProfit.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20">
                                {profitMargin.toFixed(1)}% Margin
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Growth Chart */}
                <Card className="border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Revenue vs Expenses</CardTitle>
                            <CardDescription>Monthly comparison</CardDescription>
                        </div>
                        <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card className="border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Expense Breakdown</CardTitle>
                            <CardDescription>By category</CardDescription>
                        </div>
                        <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spending Logs */}
                <Card className="lg:col-span-2 border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Spending Logs</CardTitle>
                            <CardDescription>Daily tracked expenses</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => (document.getElementById("add-expense-modal") as any)?.showModal()}>
                            <Plus className="h-4 w-4 mr-2" /> Add Expense
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expenses.map((expense) => (
                                <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">{expense.category.replace("-", " ")}</p>
                                            <p className="text-xs text-muted-foreground">{expense.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className="font-semibold text-rose-600">-${expense.amount.toFixed(2)}</p>
                                        <div className="text-right">
                                            <p className="text-xs font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExpense(expense.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Add Expense Form */}
                <Card className="border-none shadow-md h-fit">
                    <CardHeader>
                        <CardTitle>Log New Spending</CardTitle>
                        <CardDescription>Rapidly add expenses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={newExpense.category}
                                onValueChange={(val) => setNewExpense({ ...newExpense, category: val as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="raw-materials">Raw Materials</SelectItem>
                                    <SelectItem value="electricity">Electricity</SelectItem>
                                    <SelectItem value="rent">Rent</SelectItem>
                                    <SelectItem value="salary">Staff Salary</SelectItem>
                                    <SelectItem value="others">Others</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount ($)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g. Weekly vegetable refill"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                        </div>
                        <Button className="w-full" onClick={handleAddExpense}>
                            <Plus className="h-4 w-4 mr-2" />
                            Save Expense
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
