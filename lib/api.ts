import { ApiResponse, User, Order, MenuItem, Expense, DashboardStats, StaffPerformance, AttendanceLog, WasteEntry, Table, Floor, Setting, Reservation, AuthResponse } from "./types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const API_URL = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL

console.log("[API] Initialized with URL:", API_URL)

/**
 * Utility to get standard headers for API calls.
 * Handles both client-side (with localStorage) and server-side contexts.
 */
export function getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    }

    if (typeof window !== "undefined") {
        const token = localStorage.getItem("pos-token")
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
    }

    return headers
}

/**
 * Helper to handle JSON parsing and log errors if response is not JSON (e.g. HTML 404)
 */
async function parseJson(res: Response) {
    const text = await res.text()
    try {
        // Handle empty body
        if (!text) return { success: res.ok, data: null }
        return JSON.parse(text)
    } catch (err) {
        // If response is OK but not JSON (e.g. plain text "Success"), treat as success
        if (res.ok) {
            console.warn(`[API Warning] Response was OK but not JSON: ${text.substring(0, 50)}...`)
            return { success: true, data: null } // Return null data but success
        }

        console.error(`[API Error] Failed to parse JSON from ${res.url}`)
        console.error(`[API Error] Status: ${res.status} ${res.statusText}`)
        console.error(`[API Error] Response Body:`, text)
        throw new Error(`Server Error (${res.status}): ${text.substring(0, 200)}`)
    }
}

// Auth
export const login = async (email: string, password: string): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })

        const data: ApiResponse<AuthResponse> = await parseJson(res)

        if (!res.ok || !data.success) {
            throw new Error(data.error || "Login failed")
        }

        // Store token
        localStorage.setItem("pos-token", data.data.token)

        return {
            ...data.data.user,
            id: (data.data.user as any)._id || data.data.user.id
        }
    } catch (error) {
        console.error("Login error:", error)
        return null
    }
}

export const getMe = async (): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        })

        const data: ApiResponse<{ user: User }> = await parseJson(res)

        if (!res.ok || !data.success) {
            return null
        }

        return {
            ...data.data.user,
            id: (data.data.user as any)._id || data.data.user.id
        }
    } catch (error) {
        console.error("Get current user error:", error)
        return null
    }
}

export const register = async (userData: any): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        })

        const data: ApiResponse<AuthResponse> = await parseJson(res)

        if (!res.ok || !data.success) {
            throw new Error(data.error || "Registration failed")
        }

        // Store token
        localStorage.setItem("pos-token", data.data.token)

        return {
            ...data.data.user,
            id: (data.data.user as any)._id || data.data.user.id
        }
    } catch (error) {
        console.error("Registration error:", error)
        return null
    }
}

// Orders
export const getOrders = async (): Promise<Order[]> => {
    try {
        const res = await fetch(`${API_URL}/orders`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<Order[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get orders error:", error)
        return []
    }
}

export const createOrder = async (orderData: any): Promise<Order | null> => {
    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(orderData),
        })
        const data: ApiResponse<Order> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create order error:", error)
        return null
    }
}

export const updateOrderStatus = async (id: string, status: string): Promise<Order | null> => {
    try {
        const res = await fetch(`${API_URL}/orders/${id}/status`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        })
        const data: ApiResponse<Order> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update order status error:", error)
        return null
    }
}

export const updateOrder = async (id: string, orderData: any): Promise<Order | null> => {
    try {
        const res = await fetch(`${API_URL}/orders/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(orderData),
        })
        const data: ApiResponse<Order> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update order error:", error)
        return null
    }
}

// Reservations
export const getReservations = async (): Promise<Reservation[]> => {
    try {
        const res = await fetch(`${API_URL}/reservations`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<Reservation[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get reservations error:", error)
        return []
    }
}

export const createReservation = async (reservationData: any): Promise<Reservation | null> => {
    try {
        const res = await fetch(`${API_URL}/reservations`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(reservationData),
        })
        const data: ApiResponse<Reservation> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create reservation error:", error)
        return null
    }
}

export const updateReservationStatus = async (id: string, status: string): Promise<Reservation | null> => {
    try {
        const res = await fetch(`${API_URL}/reservations/${id}/status`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        })
        const data: ApiResponse<Reservation> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update reservation status error:", error)
        return null
    }
}

// Menu
export const getMenuItems = async (): Promise<MenuItem[]> => {
    try {
        const res = await fetch(`${API_URL}/menu`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<MenuItem[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get menu items error:", error)
        return []
    }
}

export const createMenuItem = async (itemData: any): Promise<MenuItem | null> => {
    try {
        const res = await fetch(`${API_URL}/menu`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(itemData),
        })
        const data: ApiResponse<MenuItem> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create menu item error:", error)
        return null
    }
}

export const updateMenuItem = async (id: string, itemData: any): Promise<MenuItem | null> => {
    try {
        const res = await fetch(`${API_URL}/menu/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(itemData),
        })
        const data: ApiResponse<MenuItem> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update menu item error:", error)
        return null
    }
}

export const deleteMenuItem = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/menu/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        })
        const data: ApiResponse<null> = await parseJson(res)
        return res.ok && data.success
    } catch (error) {
        console.error("Delete menu item error:", error)
        return false
    }
}

// Categories
export const getCategories = async (): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<any[]> = await parseJson(res)
        if (!res.ok || !data.success) return []
        return data.data
    } catch (error) {
        console.error("Get categories error:", error)
        return []
    }
}

export const createCategory = async (categoryData: any): Promise<any | null> => {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(categoryData),
        })
        const data: ApiResponse<any> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create category error:", error)
        return null
    }
}

// Floors
export const getFloors = async (): Promise<Floor[]> => {
    try {
        const res = await fetch(`${API_URL}/floors`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<Floor[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get floors error:", error)
        return []
    }
}

// Tables
export const getTables = async (): Promise<Table[]> => {
    try {
        const res = await fetch(`${API_URL}/tables`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<Table[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get tables error:", error)
        return []
    }
}

export const updateTable = async (id: string, tableData: any): Promise<Table | null> => {
    try {
        const res = await fetch(`${API_URL}/tables/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(tableData),
        })
        const data: ApiResponse<Table> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update table error:", error)
        return null
    }
}

export const createTable = async (tableData: any): Promise<Table | null> => {
    try {
        const res = await fetch(`${API_URL}/tables`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(tableData),
        })
        const data: ApiResponse<Table> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create table error:", error)
        return null
    }
}

export const deleteTable = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/tables/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        })
        const data: ApiResponse<any> = await parseJson(res)
        return res.ok && data.success
    } catch (error) {
        console.error("Delete table error:", error)
        return false
    }
}

// Users (Staff)
export const getUsers = async (): Promise<User[]> => {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<User[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get users error:", error)
        return []
    }
}

export const createUser = async (userData: any): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(userData),
        })
        const data: ApiResponse<User> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create user error:", error)
        return null
    }
}

export const updateUser = async (id: string, userData: any): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(userData),
        })
        const data: ApiResponse<User> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update user error:", error)
        return null
    }
}

export const deleteUser = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        })
        const data: ApiResponse<null> = await parseJson(res)
        return res.ok && data.success
    } catch (error) {
        console.error("Delete user error:", error)
        return false
    }
}

// Reports/Stats
export const getDashboardStats = async (): Promise<DashboardStats | null> => {
    try {
        const res = await fetch(`${API_URL}/reports/dashboard-stats`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<DashboardStats> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get dashboard stats error:", error)
        return null
    }
}

// Financials
export const getExpenses = async (): Promise<Expense[]> => {
    try {
        const res = await fetch(`${API_URL}/admin/financials/expenses`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<Expense[]> = await parseJson(res)
        if (!res.ok || !data.success) return []
        return data.data
    } catch (error) {
        console.error("Get expenses error:", error)
        return []
    }
}

export const createExpense = async (expenseData: any): Promise<Expense | null> => {
    try {
        const res = await fetch(`${API_URL}/admin/financials/expenses`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(expenseData),
        })
        const data: ApiResponse<Expense> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create expense error:", error)
        return null
    }
}

export const deleteExpense = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/admin/financials/expenses/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        })
        const data: ApiResponse<null> = await parseJson(res)
        return res.ok && data.success
    } catch (error) {
        console.error("Delete expense error:", error)
        return false
    }
}

// Operations
export const getWasteLogs = async (): Promise<WasteEntry[]> => {
    try {
        const res = await fetch(`${API_URL}/admin/operations/waste`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<WasteEntry[]> = await parseJson(res)
        if (!res.ok || !data.success) return []
        return data.data
    } catch (error) {
        console.error("Get waste logs error:", error)
        return []
    }
}

export const createWasteLog = async (wasteData: any): Promise<WasteEntry | null> => {
    try {
        const res = await fetch(`${API_URL}/admin/operations/waste`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(wasteData),
        })
        const data: ApiResponse<WasteEntry> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create waste log error:", error)
        return null
    }
}

export const getStaffPerformance = async (): Promise<StaffPerformance[]> => {
    try {
        const res = await fetch(`${API_URL}/admin/operations/performance`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<StaffPerformance[]> = await parseJson(res)
        if (!res.ok || !data.success) return []
        return data.data
    } catch (error) {
        console.error("Get staff performance error:", error)
        return []
    }
}

export const getStaffAttendance = async (): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/admin/operations/attendance`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<any[]> = await parseJson(res)
        if (!res.ok || !data.success) return []
        return data.data
    } catch (error) {
        console.error("Get staff attendance error:", error)
        return []
    }
}

export const getStaffStats = async (): Promise<any> => {
    try {
        const res = await fetch(`${API_URL}/admin/staff/stats`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<any> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get staff stats error:", error)
        return { onDuty: 0, late: 0, onLeave: 0, leaveRequests: [] }
    }
}

export const getSettings = async (): Promise<Setting[]> => {
    try {
        const res = await fetch(`${API_URL}/settings`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<Setting[]> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get settings error:", error)
        return []
    }
}

export const updateSetting = async (id: string, value: string): Promise<Setting | null> => {
    try {
        const res = await fetch(`${API_URL}/settings/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ value }),
        })
        const data: ApiResponse<Setting> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Update setting error:", error)
        return null
    }
}

export const createSetting = async (settingData: Omit<Setting, 'id'>): Promise<Setting | null> => {
    try {
        const res = await fetch(`${API_URL}/settings`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(settingData),
        })
        const data: ApiResponse<Setting> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Create setting error:", error)
        return null
    }
}


// Admin Extras
export const getFinancialSummary = async (range: string): Promise<any> => {
    try {
        const res = await fetch(`${API_URL}/admin/financial-summary` + (range ? `?range=${range}` : ""), {
            headers: getHeaders(),
        })
        const data: ApiResponse<any> = await parseJson(res)
        if (!res.ok || !data.success) throw new Error(data.error)
        return data.data
    } catch (error) {
        console.error("Get financial summary error:", error)
        return {
            revenue: 0,
            expenses: 0,
            chartData: []
        }
    }
}

export const getAIInsights = async (): Promise<string[]> => {
    try {
        const res = await fetch(`${API_URL}/admin/ai-insights`, {
            headers: getHeaders(),
        })
        const data: ApiResponse<string[]> = await parseJson(res)
        if (!res.ok || !data.success) return []
        return data.data
    } catch (error) {
        console.error("Get AI insights error:", error)
        return []
    }
}

// Consolidated API object for backward compatibility
export const api = {
    getHeaders,
    login,
    register,
    getOrders,
    createOrder,
    updateOrderStatus,
    updateOrder,
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategories,
    createCategory,
    getFloors,
    getTables,
    createTable,
    updateTable,
    deleteTable,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getDashboardStats,
    getExpenses,
    createExpense,
    deleteExpense,
    getWasteLogs,
    createWasteLog,
    getStaffPerformance,
    getStaffAttendance,
    getStaffStats,
    getSettings,
    updateSetting,
    createSetting,
    getFinancialSummary,
    getAIInsights,
    getMe,
    getReservations,
    createReservation,
    updateReservationStatus,
}
