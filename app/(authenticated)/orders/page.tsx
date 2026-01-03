import { Suspense } from "react"
import { OrdersContent } from "@/components/orders-content"

export default function OrdersPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-6">Loading orders...</div>}>
            <OrdersContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
