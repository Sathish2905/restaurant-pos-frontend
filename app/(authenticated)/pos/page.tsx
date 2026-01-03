import { Suspense } from "react"
import { POSContent } from "@/components/pos-content"

export default function POSPage() {
  return (
    <Suspense fallback={null}>
      <POSContent />
    </Suspense>
  )
}
