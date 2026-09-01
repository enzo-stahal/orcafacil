import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import QuickActions from "@/components/dashboard/QuickActions"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Erro ao buscar empresa:", error)
  }

  if (!company) {
    redirect("/empresa")
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm text-gray-500">
            Bem-vindo ao OrçaFácil
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Olá! 👋
          </h1>

          <p className="mt-2 text-gray-600">
            {company.name}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Orçamentos
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Clientes
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Serviços
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>
          </div>
        </div>

        <QuickActions />

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Últimos orçamentos
          </h2>

          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-500">
              Você ainda não possui orçamentos.
            </p>

            <a
              href="/orcamentos/novo"
              className="mt-4 inline-block font-medium text-black underline"
            >
              Criar seu primeiro orçamento
            </a>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/empresa"
            className="text-sm text-gray-600 underline hover:text-black"
          >
            Editar dados da empresa
          </a>
        </div>
      </div>
    </main>
  )
}
