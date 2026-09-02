import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StatusSelect from "./StatusSelect"
import DeleteQuoteButton from "./DeleteQuoteButton"

type Quote = {
  id: string
  number: string | null
  status: string
  subtotal: number
  discount: number
  total: number
  public_token: string | null
  created_at: string
  customer: {
    name: string
  } | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export default async function OrcamentosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: quotes, error } = await supabase
    .from("quotes")
    .select(`
      id,
      number,
      status,
      subtotal,
      discount,
      total,
      public_token,
      created_at,
      customer:customers (
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao carregar orçamentos:", error)
  }

  const quoteList = (quotes || []) as unknown as Quote[]

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              OrçaFácil
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Orçamentos
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Consulte e acompanhe todos os seus orçamentos.
            </p>
          </div>

          <Link
            href="/orcamentos/novo"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Novo orçamento
          </Link>
        </div>

        {/* Conteúdo */}
        {quoteList.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              📄
            </div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Nenhum orçamento encontrado
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Você ainda não criou nenhum orçamento. Crie seu primeiro
              orçamento para começar a acompanhar seus clientes e serviços.
            </p>

            <Link
              href="/orcamentos/novo"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Criar primeiro orçamento
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Orçamento
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Cliente
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Data
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Valor
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {quoteList.map((quote) => {
                    const quoteNumber =
                      quote.number ||
                      `#${quote.id.slice(0, 8).toUpperCase()}`

                    return (
                      <tr
                        key={quote.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-5">
                          <span className="font-semibold text-gray-900">
                            {quoteNumber}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-700">
                            {quote.customer?.name ||
                              "Cliente não encontrado"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">
                            {formatDate(quote.created_at)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(quote.total))}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <StatusSelect
                            quoteId={quote.id}
                            initialStatus={quote.status}
                          />
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {/* Editar */}
                            <Link
                              href={`/orcamentos/${quote.id}/editar`}
                              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                            >
                              Editar
                            </Link>

                            {/* Ver */}
                            {quote.public_token && (
                              <Link
                                href={`/orcamento/${quote.public_token}`}
                                target="_blank"
                                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                              >
                                Ver
                              </Link>
                            )}

                            {/* Excluir */}
                            <DeleteQuoteButton quoteId={quote.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-500">
                {quoteList.length}{" "}
                {quoteList.length === 1
                  ? "orçamento encontrado"
                  : "orçamentos encontrados"}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
