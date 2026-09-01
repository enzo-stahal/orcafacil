import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Bem-vindo ao OrçaFácil!
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Usuário conectado
          </p>

          <p className="mt-1 font-medium">
            {user.email}
          </p>
        </div>
      </div>
    </main>
  )
}