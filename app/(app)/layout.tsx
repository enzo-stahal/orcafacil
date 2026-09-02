import Sidebar from "@/components/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="min-h-screen pb-20 lg:pl-64 lg:pb-0">
        {children}
      </div>
    </div>
  )
}
