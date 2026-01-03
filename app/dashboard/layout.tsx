import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
