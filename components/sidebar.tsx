"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Settings,
  Users,
  Package,
  Store,
  LogOut,
  UtensilsCrossed,
  Calendar,
  ClipboardList,
  Plug,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
  { href: "/dashboard/menu", label: "Menu", icon: Package },
  { href: "/dashboard/tables", label: "Tables", icon: UtensilsCrossed },
  { href: "/dashboard/reservations", label: "Reservations", icon: Calendar },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const cashierLinks = [
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/table-view", label: "Table View", icon: UtensilsCrossed },
  { href: "/orders", label: "Orders", icon: ClipboardList },
]

const kitchenLinks = [{ href: "/kitchen", label: "Kitchen Display", icon: ChefHat }]

import { useSettings } from "@/lib/settings-context"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { getSetting } = useSettings()
  const restaurantName = getSetting("restaurant_name") || "POS System"

  const links = user?.role === "admin" ? adminLinks : user?.role === "cashier" ? cashierLinks : kitchenLinks

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-base leading-none truncate text-primary">{restaurantName}</h2>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium">{user?.role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
