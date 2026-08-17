import { AdminDataProvider } from "@/lib/admin/mock-store"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AdminDataProvider>{children}</AdminDataProvider>
}
