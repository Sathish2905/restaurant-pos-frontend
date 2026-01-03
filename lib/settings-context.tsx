"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { api } from "./api"
import { Setting } from "./types"

interface SettingsContextType {
    settings: Setting[]
    getSetting: (key: string) => string | undefined
    refreshSettings: () => Promise<void>
    isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Setting[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshSettings = useCallback(async () => {
        try {
            const data = await api.getSettings()
            setSettings(data)
        } catch (error) {
            console.error("Failed to load settings:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshSettings()
    }, [refreshSettings])

    const getSetting = useCallback((key: string) => {
        return settings.find(s => s.key === key)?.value
    }, [settings])

    return (
        <SettingsContext.Provider value={{ settings, getSetting, refreshSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
