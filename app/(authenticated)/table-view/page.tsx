import { Suspense } from "react"
import { TableViewContent } from "@/components/table-view-content"

export default function TableViewPage() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <Suspense fallback={null}>
        <TableViewContent />
      </Suspense>
    </div>
  )
}
