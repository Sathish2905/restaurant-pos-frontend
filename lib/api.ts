import { User, MenuItem, Category, Order, Table, Floor, Reservation, Setting } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
    error?: string
}

interface AuthResponse {
    user: User
    token: string
}

export const api = {
    // Helper to get headers with token
    getHeaders: () => {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        }

        // Only access localStorage on the client
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("pos-token")
            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }
        }
        return headers
    },

    // Helper to map order data
    mapOrder: (item: any): Order => ({
        ...item,
        id: item._id,
        tableId: item.table?._id || item.table?.id || item.table,
        tableNumber: item.table?.number,
        floorName: item.table?.floor?.name,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        items: item.items?.map((orderItem: any) => ({
            ...orderItem,
            id: orderItem.menuItem?._id || orderItem.menuItem?.id || orderItem.menuItem || orderItem._id || orderItem.id
        }))
    }),

    // Auth
    login: async (email: string, password: string): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const data: ApiResponse<AuthResponse> = await res.json()

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
    },

    register: async (userData: Partial<User>): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            })

            const data: ApiResponse<AuthResponse> = await res.json()

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
    },

    getMe: async (): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: api.getHeaders(),
            })

            const data: ApiResponse<{ user: User }> = await res.json()

            if (!res.ok || !data.success) {
                return null
            }

            return {
                ...data.data.user,
                id: (data.data.user as any)._id || data.data.user.id
            }
        } catch (error) {
            return null
        }
    },

    // Users (Staff)
    getUsers: async (): Promise<User[]> => {
        try {
            const res = await fetch(`${API_URL}/staff`, {
                headers: api.getHeaders(),
            })
            const data: ApiResponse<User[]> = await res.json()
            if (!res.ok || !data.success) return []
            return data.data.map((user: any) => ({
                ...user,
                id: user._id || user.id
            }))
        } catch (error) {
            console.error("Get users error:", error)
            return []
        }
    },

    createUser: async (userData: Partial<User>): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/staff`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(userData),
            })
            const data: ApiResponse<User> = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create user")
            }
            return {
                ...data.data,
                id: (data.data as any)._id || data.data.id
            }
        } catch (error) {
            console.error("Create user error:", error)
            return null
        }
    },

    updateUser: async (id: string, userData: Partial<User>): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/staff/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify(userData),
            })
            const data: ApiResponse<User> = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update user")
            }
            return {
                ...data.data,
                id: (data.data as any)._id || data.data.id
            }
        } catch (error) {
            console.error("Update user error:", error)
            return null
        }
    },

    deleteUser: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/staff/${id}`, {
                method: "DELETE",
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to delete user")
            }
            return true
        } catch (error) {
            console.error("Delete user error:", error)
            return false
        }
    },

    // Menu
    getMenuItems: async (): Promise<MenuItem[]> => {
        try {
            const res = await fetch(`${API_URL}/menu`, {
                headers: api.getHeaders(),
            })

            const data: ApiResponse<any[]> = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch menu items")
            }

            // Map _id to id
            return data.data.map((item: any) => ({
                ...item,
                id: item._id || item.id,
                category: item.category?.name || item.category,
                available: item.available !== undefined ? Boolean(item.available) : true,
            }))
        } catch (error) {
            console.error("Get menu items error:", error)
            return []
        }
    },

    createMenuItem: async (item: Omit<MenuItem, "id">): Promise<MenuItem | null> => {
        try {
            const res = await fetch(`${API_URL}/menu`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(item),
            })

            const data: ApiResponse<any> = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create menu item")
            }

            return {
                ...data.data,
                id: data.data._id,
                category: data.data.category?.name || data.data.category,
            }
        } catch (error) {
            console.error("Create menu item error:", error)
            return null
        }
    },

    updateMenuItem: async (id: string, item: Partial<MenuItem>): Promise<MenuItem | null> => {
        try {
            const res = await fetch(`${API_URL}/menu/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify(item),
            })

            const data: ApiResponse<any> = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update menu item")
            }

            return {
                ...data.data,
                id: data.data._id,
                category: data.data.category?.name || data.data.category,
            }
        } catch (error) {
            console.error("Update menu item error:", error)
            return null
        }
    },

    deleteMenuItem: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/menu/${id}`, {
                method: "DELETE",
                headers: api.getHeaders(),
            })

            const data: ApiResponse<any> = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to delete menu item")
            }

            return true
        } catch (error) {
            console.error("Delete menu item error:", error)
            return false
        }
    },

    // Categories
    getCategories: async (): Promise<Category[]> => {
        try {
            const res = await fetch(`${API_URL}/categories`, {
                headers: api.getHeaders(),
            })

            const data: ApiResponse<any[]> = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch categories")
            }

            return data.data.map((item: any) => ({
                ...item,
                id: item._id,
            }))
        } catch (error) {
            console.error("Get categories error:", error)
            return []
        }
    },

    createCategory: async (category: Omit<Category, "id">): Promise<Category | null> => {
        try {
            const res = await fetch(`${API_URL}/categories`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(category),
            })

            const data: ApiResponse<any> = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create category")
            }

            return {
                ...data.data,
                id: data.data._id,
            }
        } catch (error) {
            console.error("Create category error:", error)
            return null
        }
    },

    // Orders
    getOrders: async (): Promise<Order[]> => {
        try {
            const res = await fetch(`${API_URL}/orders`, {
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any[]> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return data.data.map(api.mapOrder)
        } catch (error) {
            console.error("Get orders error:", error)
            return []
        }
    },

    createOrder: async (order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order | null> => {
        try {
            const payload = {
                ...order,
                table: order.tableId,
                items: order.items.map(item => ({
                    menuItem: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            }
            const res = await fetch(`${API_URL}/orders`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(payload),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return api.mapOrder(data.data)
        } catch (error) {
            console.error("Create order error:", error)
            return null
        }
    },

    updateOrder: async (id: string, order: Partial<Order>): Promise<Order | null> => {
        try {
            const payload = {
                ...order,
                table: order.tableId,
                items: order.items?.map(item => ({
                    menuItem: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            }
            const res = await fetch(`${API_URL}/orders/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify(payload),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return api.mapOrder(data.data)
        } catch (error) {
            console.error("Update order error:", error)
            return null
        }
    },

    // Tables
    getTables: async (): Promise<Table[]> => {
        try {
            const res = await fetch(`${API_URL}/tables`, {
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any[]> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return data.data.map((item: any) => ({
                ...item,
                id: item._id || item.id,
                floorId: item.floor?._id || item.floor?.id || item.floor
            }))
        } catch (error) {
            console.error("Get tables error:", error)
            return []
        }
    },

    createTable: async (table: Omit<Table, "id">): Promise<Table | null> => {
        try {
            const res = await fetch(`${API_URL}/tables`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(table),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return {
                ...data.data,
                id: data.data._id || data.data.id,
                floorId: data.data.floor?._id || data.data.floor?.id || data.data.floor
            }
        } catch (error) {
            console.error("Create table error:", error)
            return null
        }
    },

    updateTable: async (id: string, table: Partial<Table>): Promise<Table | null> => {
        try {
            const res = await fetch(`${API_URL}/tables/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify(table),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return {
                ...data.data,
                id: data.data._id || data.data.id,
                floorId: data.data.floor?._id || data.data.floor?.id || data.data.floor
            }
        } catch (error) {
            console.error("Update table error:", error)
            return null
        }
    },

    deleteTable: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/tables/${id}`, {
                method: "DELETE",
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)
            return true
        } catch (error) {
            console.error("Delete table error:", error)
            return false
        }
    },

    // Floors
    getFloors: async (): Promise<Floor[]> => {
        try {
            const res = await fetch(`${API_URL}/floors`, {
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any[]> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return data.data.map((item: any) => ({
                ...item,
                id: item._id,
            }))
        } catch (error) {
            console.error("Get floors error:", error)
            return []
        }
    },

    createFloor: async (floor: Omit<Floor, "id">): Promise<Floor | null> => {
        try {
            const res = await fetch(`${API_URL}/floors`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(floor),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return { ...data.data, id: data.data._id }
        } catch (error) {
            console.error("Create floor error:", error)
            return null
        }
    },

    updateFloor: async (id: string, floor: Partial<Floor>): Promise<Floor | null> => {
        try {
            const res = await fetch(`${API_URL}/floors/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify(floor),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return { ...data.data, id: data.data._id }
        } catch (error) {
            console.error("Update floor error:", error)
            return null
        }
    },

    deleteFloor: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/floors/${id}`, {
                method: "DELETE",
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)
            return true
        } catch (error) {
            console.error("Delete floor error:", error)
            return false
        }
    },
    // Reservations
    getReservations: async (): Promise<Reservation[]> => {
        try {
            const res = await fetch(`${API_URL}/reservations`, {
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any[]> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return data.data.map((item: any) => ({
                ...item,
                id: item._id,
            }))
        } catch (error) {
            console.error("Get reservations error:", error)
            return []
        }
    },

    createReservation: async (reservation: Omit<Reservation, "id" | "createdAt" | "status">): Promise<Reservation | null> => {
        try {
            const res = await fetch(`${API_URL}/reservations`, {
                method: "POST",
                headers: api.getHeaders(),
                body: JSON.stringify(reservation),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return { ...data.data, id: data.data._id }
        } catch (error) {
            console.error("Create reservation error:", error)
            return null
        }
    },

    updateReservation: async (id: string, reservation: Partial<Reservation>): Promise<Reservation | null> => {
        try {
            const res = await fetch(`${API_URL}/reservations/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify(reservation),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return { ...data.data, id: data.data._id }
        } catch (error) {
            console.error("Update reservation error:", error)
            return null
        }
    },

    deleteReservation: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/reservations/${id}`, {
                method: "DELETE",
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any> = await res.json()
            return res.ok && data.success
        } catch (error) {
            console.error("Delete reservation error:", error)
            return false
        }
    },

    // Settings
    getSettings: async (): Promise<Setting[]> => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                headers: api.getHeaders(),
            })
            const data: ApiResponse<any[]> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return data.data.map((item: any) => ({
                ...item,
                id: item._id || item.id,
            }))
        } catch (error) {
            console.error("Get settings error:", error)
            return []
        }
    },

    updateSetting: async (id: string, value: string): Promise<Setting | null> => {
        try {
            const res = await fetch(`${API_URL}/settings/${id}`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify({ value }),
            })
            const data: ApiResponse<any> = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error)

            return { ...data.data, id: data.data._id || data.data.id }
        } catch (error) {
            console.error("Update setting error:", error)
            return null
        }
    },

    bulkUpdateSettings: async (settings: { id: string; value: string }[]): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/settings/bulk`, {
                method: "PUT",
                headers: api.getHeaders(),
                body: JSON.stringify({ settings }),
            })
            const data: ApiResponse<any> = await res.json()
            return res.ok && data.success
        } catch (error) {
            console.error("Bulk update settings error:", error)
            return false
        }
    },
}
