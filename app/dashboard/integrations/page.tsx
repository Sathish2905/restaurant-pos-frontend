"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { type DeliveryIntegration } from "@/lib/types"
import { useState } from "react"
import { RefreshCw, CheckCircle2, XCircle, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<DeliveryIntegration[]>([
    {
      id: "1",
      name: "swiggy",
      enabled: false,
      autoAcceptOrders: false,
      syncMenu: false,
    },
    {
      id: "2",
      name: "zomato",
      enabled: false,
      autoAcceptOrders: false,
      syncMenu: false,
    },
  ])
  const { toast } = useToast()

  const handleToggle = (id: string, enabled: boolean) => {
    setIntegrations(integrations.map((int) => (int.id === id ? { ...int, enabled } : int)))
    toast({
      title: enabled ? "Integration enabled" : "Integration disabled",
      description: `${integrations.find((i) => i.id === id)?.name} has been ${enabled ? "enabled" : "disabled"}`,
    })
  }

  const handleSync = (name: string) => {
    toast({
      title: "Menu synced",
      description: `Menu successfully synced with ${name}`,
    })
  }

  const getIntegrationIcon = (name: string) => {
    switch (name) {
      case "swiggy":
        return "🍊"
      case "zomato":
        return "🍅"
      default:
        return "🚚"
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Delivery Integrations</h1>
          <p className="text-muted-foreground">Connect with Swiggy and Zomato to receive online orders</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getIntegrationIcon(integration.name)}</div>
                    <div>
                      <CardTitle className="capitalize">{integration.name}</CardTitle>
                      <CardDescription>{integration.enabled ? "Connected" : "Not connected"}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={integration.enabled ? "default" : "secondary"}>
                    {integration.enabled ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {integration.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`${integration.name}-enabled`}>Enable Integration</Label>
                    <p className="text-sm text-muted-foreground">Receive orders from {integration.name}</p>
                  </div>
                  <Switch
                    id={`${integration.name}-enabled`}
                    checked={integration.enabled}
                    onCheckedChange={(checked: boolean) => handleToggle(integration.id, checked)}
                  />
                </div>

                {integration.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`${integration.name}-api-key`}>API Key</Label>
                      <Input
                        id={`${integration.name}-api-key`}
                        type="password"
                        placeholder="Enter your API key"
                        defaultValue={integration.apiKey || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${integration.name}-restaurant-id`}>Restaurant ID</Label>
                      <Input
                        id={`${integration.name}-restaurant-id`}
                        placeholder="Enter restaurant ID"
                        defaultValue={integration.restaurantId || ""}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`${integration.name}-auto-accept`}>Auto-accept orders</Label>
                        <p className="text-sm text-muted-foreground">Automatically accept incoming orders</p>
                      </div>
                      <Switch
                        id={`${integration.name}-auto-accept`}
                        defaultChecked={integration.autoAcceptOrders}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`${integration.name}-sync-menu`}>Sync menu</Label>
                        <p className="text-sm text-muted-foreground">Keep menu items in sync</p>
                      </div>
                      <Switch id={`${integration.name}-sync-menu`} defaultChecked={integration.syncMenu} />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleSync(integration.name)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Menu
                      </Button>
                      <Button className="flex-1">Save Settings</Button>
                    </div>

                    {integration.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground text-center">
                        Last synced: {integration.lastSyncedAt.toLocaleString()}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Order Flow
            </CardTitle>
            <CardDescription>How online orders are processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Order Received</p>
                  <p className="text-sm text-muted-foreground">
                    Orders from Swiggy and Zomato appear in your Orders page and Kitchen Display
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Prepare Order</p>
                  <p className="text-sm text-muted-foreground">Kitchen staff prepares the order normally</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Mark Ready</p>
                  <p className="text-sm text-muted-foreground">
                    Status updates are automatically sent to the delivery platform
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium">Delivery Partner Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    Delivery partner collects and delivers to customer
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
