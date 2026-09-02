import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{
    token: string
  }>
}

type QuoteData = {
  id: string
  number: string | null
  status: string
  subtotal: number
  discount: number
  total: number
  notes: string | null
  created_at: string
  customer: {
    name: string
    email: string | null
    phone: string | null
    whatsapp: string | null
    document: string | null
    address: string | null
    city: string | null
    state: string | null
  } | null
  items: {
    id: string
    description: string
    quantity: number
    unit_price: number
    total: number
  }[]
}

export default async function PublicQuotePage({
  params,
}: PageProps) {
  const { token } = await params

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    "get_public_quote",
    {
      p_token: token,
    }
  )

  if (error) {
    console.error(
      "Erro ao buscar orçamento público:",
      error
    )

    notFound()
  }

  if (!data) {
    notFound()
  }

  const quote = data as QuoteData

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date))
  }

  const quoteNumber =
    quote.number ||
    `#${quote.id.slice(0, 8).toUpperCase()}`

  const customer = quote.customer

  // URL pública do orçamento
  // Usa o domínio que o cliente está acessando,
  // evitando depender do NEXT_PUBLIC_SITE_URL.
  const headersList = await headers()

  const host = headersList.get("host")
  const forwardedProto = headersList.get("x-forwarded-proto")

  const protocol =
    forwardedProto ||
    (process.env.NODE_ENV === "development"
      ? "http"
      : "https")

  const publicUrl =
    `${protocol}://${host}/orcamento/${token}`

  // WhatsApp
  const whatsappNumber =
    customer?.whatsapp ||
    customer?.phone ||
    ""

  const whatsappMessage =
    `Olá, ${customer?.name || "tudo bem"}! Segue seu orçamento ${quoteNumber} pelo OrçaFácil:\n\n${publicUrl}`

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* CABEÇALHO */}

        <div className="mb-6 flex flex-col items-center gap-4 text-center">

          <div>
            <p className="text-sm font-medium text-gray-500">
              OrçaFácil
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Orçamento {quoteNumber}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Emitido em {formatDate(quote.created_at)}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <span>📱</span>
            Enviar pelo WhatsApp
          </a>

        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* EMPRESA */}

          <div className="border-b border-gray-200 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Orçamento
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              OrçaFácil
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Proposta comercial
            </p>
          </div>

          {/* CLIENTE */}

          <div className="border-b border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Cliente
            </h2>

            {customer ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Nome
                  </p>

                  <p className="mt-1 text-gray-900">
                    {customer.name || "Não informado"}
                  </p>
                </div>

                {customer.document && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Documento
                    </p>

                    <p className="mt-1 text-gray-900">
                      {customer.document}
                    </p>
                  </div>
                )}

                {customer.email && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      E-mail
                    </p>

                    <p className="mt-1 break-all text-gray-900">
                      {customer.email}
                    </p>
                  </div>
                )}

                {customer.phone && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Telefone
                    </p>

                    <p className="mt-1 text-gray-900">
                      {customer.phone}
                    </p>
                  </div>
                )}

                {customer.address && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Endereço
                    </p>

                    <p className="mt-1 text-gray-900">
                      {customer.address}
                      {customer.city &&
                        `, ${customer.city}`}
                      {customer.state &&
                        ` - ${customer.state}`}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Dados do cliente não informados.
              </p>
            )}
          </div>

          {/* SERVIÇOS */}

          <div className="border-b border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Serviços
            </h2>

            {!quote.items || quote.items.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum serviço informado.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">

                {/* CABEÇALHO DESKTOP */}

                <div className="hidden grid-cols-[1fr_100px_140px_140px] gap-4 border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-500 sm:grid">
                  <span>Descrição</span>
                  <span>Qtd.</span>
                  <span>Valor unitário</span>
                  <span className="text-right">
                    Total
                  </span>
                </div>

                {/* ITENS */}

                <div className="divide-y divide-gray-200">
                  {quote.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 p-4 sm:grid-cols-[1fr_100px_140px_140px] sm:items-center sm:gap-4"
                    >

                      <div>
                        <p className="font-medium text-gray-900">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex justify-between sm:block">
                        <span className="text-sm text-gray-500 sm:hidden">
                          Quantidade
                        </span>

                        <span className="text-gray-900">
                          {Number(item.quantity)}
                        </span>
                      </div>

                      <div className="flex justify-between sm:block">
                        <span className="text-sm text-gray-500 sm:hidden">
                          Valor unitário
                        </span>

                        <span className="text-gray-900">
                          {formatCurrency(
                            Number(item.unit_price)
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between sm:block sm:text-right">
                        <span className="text-sm text-gray-500 sm:hidden">
                          Total
                        </span>

                        <span className="font-semibold text-gray-900">
                          {formatCurrency(
                            Number(item.total)
                          )}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VALORES */}

          <div className="border-b border-gray-200 p-6 sm:p-8">
            <div className="ml-auto max-w-sm space-y-4">

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  {formatCurrency(
                    Number(quote.subtotal)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Desconto
                </span>

                <span className="font-medium text-gray-900">
                  {formatCurrency(
                    Number(quote.discount)
                  )}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">

                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      Number(quote.total)
                    )}
                  </span>

                </div>
              </div>

            </div>
          </div>

          {/* OBSERVAÇÕES */}

          {quote.notes && (
            <div className="border-b border-gray-200 p-6 sm:p-8">

              <h2 className="text-lg font-semibold text-gray-900">
                Observações
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {quote.notes}
              </p>

            </div>
          )}

          {/* STATUS */}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Status do orçamento
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {quote.status === "draft"
                    ? "Rascunho"
                    : quote.status}
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-gray-200 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                {quote.status === "draft"
                  ? "Rascunho"
                  : quote.status}
              </span>

            </div>
          </div>

        </div>

        {/* RODAPÉ */}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Este orçamento foi criado através do OrçaFácil.
          </p>
        </div>

      </div>
    </main>
  )
}

