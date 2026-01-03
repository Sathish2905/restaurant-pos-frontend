import { Suspense } from "react"
import ReservationsManagementContent from "@/components/reservations-management-content"

export default function ReservationsManagementPage() {
  return (
    <Suspense fallback={null}>
      <ReservationsManagementContent />
    </Suspense>
  )
}
