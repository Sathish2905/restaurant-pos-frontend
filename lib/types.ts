export type UserRole = "admin" | "cashier" | "kitchen" | "staff"

export const UserRoles = {
    ADMIN: "admin" as const,
    CASHIER: "cashier" as const,
    KITCHEN: "kitchen" as const,
    STAFF: "staff" as const,
}

export interface User {
    id: string
    email: string
    username?: string
    password?: string
    name: string
    role: UserRole
    status: "active" | "inactive"
}

export interface Category {
    id: string
    name: string
    icon: string
}

export interface MenuItem {
    id: string
    name: string
    category: string
    price: number
    image: string
    available: boolean
    description?: string
}

export interface CartItem extends MenuItem {
    quantity: number
}

export interface Table {
    id: string
    number: number
    floorId: string
    capacity: number
    status: "available" | "occupied" | "reserved"
    shape: "circle" | "square" | "rectangle"
    position: { x: number; y: number }
    rotation?: number
}

export interface Floor {
    id: string
    name: string
    description?: string
    type?: "floor" | "party-hall"
}

export interface Reservation {
    id: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    tableId: string
    floorId: string
    date: Date
    time: string
    partySize: number
    menuItems?: CartItem[]
    specialRequests?: string
    status: "pending" | "confirmed" | "completed" | "cancelled"
    createdAt: Date
}

export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "held"
export type OrderType = "dine-in" | "takeaway" | "delivery"

export interface Order {
    id: string
    type: OrderType
    items: CartItem[]
    subtotal: number
    total: number
    tax: number
    discount: number
    status: OrderStatus
    paymentStatus?: "paid" | "unpaid" | "partial"
    createdAt: Date
    updatedAt?: Date
    cashierName: string
    tableId?: string
    tableNumber?: number
    floorName?: string
    notes?: string
    customerName?: string
    source?: "pos" | "swiggy" | "zomato"
    deliveryAddress?: string
    deliveryPhone?: string
}

export interface DeliveryIntegration {
    id: string
    name: "swiggy" | "zomato"
    enabled: boolean
    apiKey?: string
    restaurantId?: string
    autoAcceptOrders: boolean
    syncMenu: boolean
    lastSyncedAt?: Date
}
export interface Setting {
    id: string
    key: string
    value: string
    description?: string
    category: string
    type: "string" | "number" | "boolean"
}
