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

  // Buscar empresa
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (companyError) {
    console.error("Erro ao buscar empresa:", companyError)
  }

  if (!company) {
    redirect("/empresa")
  }

  // Buscar quantidade de clientes
  const { count: customersCount, error: customersError } =
    await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

  if (customersError) {
    console.error("Erro ao buscar clientes:", customersError)
  }

  // Buscar quantidade de serviços
  const { count: servicesCount, error: servicesError } =
    await supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

  if (servicesError) {
    console.error("Erro ao buscar serviços:", servicesError)
  }

  // Buscar orçamentos
  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select(`
      id,
      number,
      status,
      total,
      created_at,
      customers (
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (quotesError) {
    console.error("Erro ao buscar orçamentos:", quotesError)
  }

  const totalQuotes = quotes?.length ?? 0

  const totalQuotesValue =
    quotes?.reduce((sum, quote) => {
      return sum + Number(quote.total || 0)
    }, 0) ?? 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR").format(
      new Date(date)
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Cabeçalho */}
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

        {/* Indicadores */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Orçamentos */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Orçamentos
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalQuotes}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {formatCurrency(totalQuotesValue)}
            </p>
          </div>

          {/* Clientes */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Clientes
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {customersCount ?? 0}
            </p>
          </div>

          {/* Serviços */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Serviços
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {servicesCount ?? 0}
            </p>
          </div>
        </div>

        {/* Ações rápidas */}
        <QuickActions />

        {/* Últimos orçamentos */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Últimos orçamentos
            </h2>

            {totalQuotes > 0 && (
              <a
                href="/orcamentos"
                className="text-sm font-medium text-gray-600 underline hover:text-black"
              >
                Ver todos
              </a>
            )}
          </div>

          {totalQuotes === 0 ? (
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
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">

              <div className="divide-y divide-gray-200">

                {quotes.slice(0, 5).map((quote) => {
                  const customer = Array.isArray(quote.customers)
                    ? quote.customers[0]
                    : quote.customers

                  return (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >

                      <div>
                        <p className="font-medium text-gray-900">
                          {quote.number || "Orçamento"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {customer?.name || "Cliente não informado"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(quote.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(Number(quote.total || 0))}
                        </p>

                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {quote.status === "draft"
                            ? "Rascunho"
                            : quote.status}
                        </p>
                      </div>

                    </div>
                  )
                })}

              </div>
            </div>
          )}
        </div>

        {/* Empresa */}
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

