"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { Setting } from "@/lib/types"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

import { useSettings } from "@/lib/settings-context"

export default function SettingsPage() {
  const { refreshSettings: refreshGlobalSettings } = useSettings()
  const [settings, setSettings] = useState<Setting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const data = await api.getSettings()
      setSettings(data)
    } catch (error) {
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (id: string, value: string) => {
    setChanges(prev => ({ ...prev, [id]: value }))
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s))
  }

  const handleSave = async (category?: string) => {
    setIsSaving(true)
    try {
      const settingsToUpdate = Object.entries(changes)
        .filter(([id]) => {
          if (!category) return true;
          return settings.find(s => s.id === id)?.category === category;
        })
        .map(([id, value]) => ({ id, value }))

      if (settingsToUpdate.length === 0) {
        toast.info("No changes to save")
        return
      }

      const success = await api.bulkUpdateSettings(settingsToUpdate)
      if (success) {
        toast.success("Settings saved successfully")
        // Refresh global context so Navbar/Sidebar update immediately
        await refreshGlobalSettings()

        // Remove saved changes from the changes state
        const updatedChanges = { ...changes }
        settingsToUpdate.forEach(s => delete updatedChanges[s.id])
        setChanges(updatedChanges)
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const categories = Array.from(new Set(settings.map(s => s.category)))

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your restaurant settings and preferences</p>
          </div>
          <Button
            onClick={() => handleSave()}
            disabled={isSaving || Object.keys(changes).length === 0}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
          </Button>
        </div>

        {categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>Configure {category.toLowerCase()} settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings
                .filter(s => s.category === category)
                .map((setting, index, arr) => (
                  <div key={setting.id} className="space-y-4">
                    <div className={setting.type === "boolean" ? "flex items-center justify-between" : "space-y-2"}>
                      <div className={setting.type === "boolean" ? "flex-1 mr-4" : ""}>
                        <Label htmlFor={setting.id}>{setting.key.replace(/_/g, ' ')}</Label>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        )}
                      </div>

                      {setting.type === "boolean" ? (
                        <Switch
                          id={setting.id}
                          checked={setting.value === "true"}
                          onCheckedChange={(checked) => handleChange(setting.id, checked.toString())}
                        />
                      ) : (
                        <Input
                          id={setting.id}
                          type={setting.type === "number" ? "number" : "text"}
                          value={setting.value}
                          onChange={(e) => handleChange(setting.id, e.target.value)}
                        />
                      )}
                    </div>
                    {index < arr.length - 1 && <Separator />}
                  </div>
                ))}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(category)}
                  disabled={isSaving || !Object.entries(changes).some(([id]) => settings.find(s => s.id === id)?.category === category)}
                >
                  Save {category}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
