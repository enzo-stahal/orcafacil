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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] px-4 py-8 sm:px-6 sm:py-10">

      {/* Elementos decorativos */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-yellow-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">

        {/* Cabeçalho */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl shadow-lg">
                ⚡
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Bem-vindo ao OrçaFácil
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Olá! 👋
                </h1>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500 sm:ml-[60px] sm:text-base">
              {company.name}
            </p>
          </div>

          <a
            href="/empresa"
            className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-black"
          >
            ⚙
            Configurações da empresa
          </a>

        </div>

        {/* Indicadores */}
        <div className="grid gap-5 md:grid-cols-3">

          {/* Orçamentos */}
          <div className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Orçamentos
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {totalQuotes}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                📄
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500">
                Valor total
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatCurrency(totalQuotesValue)}
              </p>
            </div>

          </div>

          {/* Clientes */}
          <div className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Clientes
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {customersCount ?? 0}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                👥
              </div>
            </div>

            <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
              Clientes cadastrados
            </p>

          </div>

          {/* Serviços */}
          <div className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/40 transition hover:-translate-y-1 hover:shadow-xl">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Serviços
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {servicesCount ?? 0}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-lg">
                🔧
              </div>
            </div>

            <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
              Serviços cadastrados
            </p>

          </div>

        </div>

        {/* Ações rápidas */}
        <div className="mt-8">
          <QuickActions />
        </div>

        {/* Últimos orçamentos */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">

          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 sm:px-8">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Últimos orçamentos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Acompanhe os orçamentos mais recentes.
              </p>
            </div>

            {totalQuotes > 0 && (
              <a
                href="/orcamentos"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-black sm:block"
              >
                Ver todos →
              </a>
            )}

          </div>

          {totalQuotes === 0 ? (

            /* Estado vazio */
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                📄
              </div>

              <h3 className="font-semibold text-gray-900">
                Nenhum orçamento ainda
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Você ainda não possui orçamentos. Crie seu primeiro orçamento para começar.
              </p>

              <a
                href="/orcamentos/novo"
                className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-gray-800"
              >
                + Criar orçamento
              </a>

            </div>

          ) : (

            /* Lista */
            <div className="p-4 sm:p-6">

              <div className="overflow-hidden rounded-2xl border border-gray-200">

                <div className="divide-y divide-gray-100">

                  {(quotes ?? []).slice(0, 5).map((quote) => {
                    const customer = Array.isArray(quote.customers)
                      ? quote.customers[0]
                      : quote.customers

                    return (
                      <div
                        key={quote.id}
                        className="group flex items-center justify-between gap-4 p-4 transition hover:bg-gray-50 sm:p-5"
                      >

                        {/* Informações */}
                        <div className="flex min-w-0 items-center gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700">
                            #
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-gray-900">
                              {quote.number || "Orçamento"}
                            </p>

                            <p className="mt-1 truncate text-sm text-gray-500">
                              {customer?.name || "Cliente não informado"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {formatDate(quote.created_at)}
                            </p>

                          </div>

                        </div>

                        {/* Valor e status */}
                        <div className="shrink-0 text-right">

                          <p className="font-semibold text-gray-900">
                            {formatCurrency(Number(quote.total || 0))}
                          </p>

                          <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                            {quote.status === "draft"
                              ? "Rascunho"
                              : quote.status}
                          </span>

                        </div>

                      </div>
                    )
                  })}

                </div>

              </div>

              {/* Ver todos - mobile */}
              {totalQuotes > 0 && (
                <div className="mt-4 text-center sm:hidden">
                  <a
                    href="/orcamentos"
                    className="text-sm font-semibold text-gray-600 underline underline-offset-4 hover:text-black"
                  >
                    Ver todos os orçamentos
                  </a>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Atalho empresa */}
        <div className="mt-8 flex justify-center pb-4">
          <a
            href="/empresa"
            className="text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-black hover:underline"
          >
            Editar dados da empresa →
          </a>
        </div>

        {/* Rodapé */}
        <p className="mt-2 pb-4 text-center text-xs text-gray-400">
          ⚡ OrçaFácil · Simples. Rápido. Organizado.
        </p>

      </div>
    </main>
  )
}