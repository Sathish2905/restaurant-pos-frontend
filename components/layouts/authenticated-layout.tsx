"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>
    }

    if (!user) {
        return null
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} />
                <main className="flex-1 overflow-auto bg-muted/30 transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    )
}
