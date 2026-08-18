import { AdminDataProvider } from "@/lib/admin/mock-store"
import { QueryProvider } from "@/components/providers/query-provider"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <QueryProvider>
      <AdminDataProvider>{children}</AdminDataProvider>
    </QueryProvider>
  )
}
