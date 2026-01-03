import { Suspense } from "react"
import { OrdersManagementContent } from "@/components/orders-management-content"

export default function OrdersManagementPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersManagementContent />
    </Suspense>
  )
}
