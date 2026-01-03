"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function TablesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { label: "Tables", href: "/dashboard/tables" },
    { label: "Floors", href: "/dashboard/tables/floors" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.href}
            variant="ghost"
            onClick={() => router.push(tab.href)}
            className={cn("rounded-none border-b-2 border-transparent", pathname === tab.href && "border-primary")}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {children}
    </div>
  )
}
