import { Suspense } from "react"
import { StaffManagementContent } from "@/components/staff-management-content"

export default function StaffManagementPage() {
  return (
    <Suspense fallback={null}>
      <StaffManagementContent />
    </Suspense>
  )
}
