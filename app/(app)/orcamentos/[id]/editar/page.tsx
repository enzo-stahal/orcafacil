"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Quote = {
  id: string
  number: string | null
  status: string
  subtotal: number
  discount: number
  total: number
  notes: string | null
  customer_id: string
  created_at: string
}

type QuoteItem = {
  id: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  total: number
}

type Customer = {
  id: string
  name: string
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number
}

type EditableItem = {
  id: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
}

const supabase = createClient()

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default function EditarOrcamentoPage() {
  const params = useParams()
  const router = useRouter()

  const quoteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [quote, setQuote] = useState<Quote | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [customerId, setCustomerId] = useState("")
  const [items, setItems] = useState<EditableItem[]>([])
  const [discount, setDiscount] = useState("0")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          id,
          number,
          status,
          subtotal,
          discount,
          total,
          notes,
          customer_id,
          created_at
        `)
        .eq("id", quoteId)
        .eq("user_id", user.id)
        .single()

      if (quoteError || !quoteData) {
        console.error("Erro ao carregar orçamento:", quoteError)
        router.replace("/orcamentos")
        return
      }

      const { data: itemData, error: itemsError } = await supabase
        .from("quote_items")
        .select(`
          id,
          service_id,
          description,
          quantity,
          unit_price,
          total
        `)
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: true })

      if (itemsError) {
        console.error("Erro ao carregar itens:", itemsError)
      }

      const { data: customerData, error: customersError } =
        await supabase
          .from("customers")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name", { ascending: true })

      if (customersError) {
        console.error("Erro ao carregar clientes:", customersError)
      }

      const { data: serviceData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, description, price")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

      if (servicesError) {
        console.error("Erro ao carregar serviços:", servicesError)
      }

      setQuote(quoteData as Quote)

      setCustomerId(quoteData.customer_id)
      setDiscount(String(Number(quoteData.discount || 0)))
      setNotes(quoteData.notes || "")

      setItems(
        (itemData || []).map((item) => ({
          id: item.id,
          service_id: item.service_id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        }))
      )

      setCustomers((customerData || []) as Customer[])
      setServices((serviceData || []) as Service[])

      setLoading(false)
    }

    loadData()
  }, [quoteId, router])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price
    }, 0)
  }, [items])

  const discountValue = Math.max(0, Number(discount) || 0)

  const total = Math.max(0, subtotal - discountValue)

  function updateItem(
    itemId: string,
    field: "description" | "quantity" | "unit_price",
    value: string
  ) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        if (field === "description") {
          return {
            ...item,
            description: value,
          }
        }

        if (field === "quantity") {
          return {
            ...item,
            quantity: Number(value) || 0,
          }
        }

        return {
          ...item,
          unit_price: Number(value) || 0,
        }
      })
    )
  }

  function removeItem(itemId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    )
  }

  function addService(serviceId: string) {
    if (!serviceId) {
      return
    }

    const service = services.find((item) => item.id === serviceId)

    if (!service) {
      return
    }

    setItems((currentItems) => [
      ...currentItems,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        service_id: service.id,
        description: service.name,
        quantity: 1,
        unit_price: Number(service.price) || 0,
      },
    ])
  }

  async function handleSave() {
    if (!customerId) {
      alert("Selecione um cliente.")
      return
    }

    if (items.length === 0) {
      alert("Adicione pelo menos um item ao orçamento.")
      return
    }

    const invalidItem = items.find(
      (item) =>
        !item.description.trim() ||
        item.quantity <= 0 ||
        item.unit_price < 0
    )

    if (invalidItem) {
      alert(
        "Verifique os itens do orçamento. A descrição é obrigatória, a quantidade deve ser maior que zero e o preço não pode ser negativo."
      )
      return
    }

    if (discountValue > subtotal) {
      alert("O desconto não pode ser maior que o subtotal.")
      return
    }

    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      /*
       * Primeiro atualizamos o orçamento principal.
       */
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          customer_id: customerId,
          subtotal,
          discount: discountValue,
          total,
          notes: notes.trim() || null,
        })
        .eq("id", quoteId)
        .eq("user_id", user.id)

      if (quoteError) {
        console.error("Erro ao atualizar orçamento:", quoteError)
        alert("Não foi possível salvar o orçamento.")
        return
      }

      /*
       * Removemos os itens antigos.
       * Depois inserimos novamente os itens atuais.
       */
      const { error: deleteItemsError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId)

      if (deleteItemsError) {
        console.error(
          "Erro ao remover itens antigos:",
          deleteItemsError
        )

        alert("Não foi possível atualizar os itens do orçamento.")
        return
      }

      const quoteItems = items.map((item) => ({
        quote_id: quoteId,
        service_id: item.service_id,
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))

      const { error: insertItemsError } = await supabase
        .from("quote_items")
        .insert(quoteItems)

      if (insertItemsError) {   
        console.error(
          "Erro ao inserir itens atualizados:",
          insertItemsError
        )

        alert(
          "O orçamento foi atualizado, mas houve um erro ao salvar os itens."
        )

        return
      }

      alert("Orçamento atualizado com sucesso!")

      router.push("/orcamentos")
      router.refresh()
    } catch (error) {
      console.error("Erro inesperado ao salvar orçamento:", error)

      alert("Ocorreu um erro inesperado ao salvar o orçamento.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Carregando orçamento...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!quote) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            OrçaFácil
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Editar orçamento
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Altere as informações do orçamento e salve as mudanças.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            {/* Número */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Número do orçamento
              </label>

              <input
                type="text"
                value={
                  quote.number ||
                  `#${quote.id.slice(0, 8).toUpperCase()}`
                }
                disabled
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Cliente
              </label>

              <select
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Selecione um cliente</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Itens */}
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Itens do orçamento
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Altere os serviços, quantidades e valores.
                  </p>
                </div>

                <select
                  defaultValue=""
                  onChange={(event) => {
                    addService(event.target.value)
                    event.target.value = ""
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="">
                    + Adicionar serviço
                  </option>

                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {formatCurrency(Number(service.price))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 space-y-4">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">
                      Nenhum item adicionado.
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Selecione um serviço acima para adicionar.
                    </p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">
                          Item {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Descrição */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600">
                            Descrição
                          </label>

                          <input
                            type="text"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "description",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        {/* Quantidade */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600">
                            Quantidade
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "quantity",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        {/* Preço */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600">
                            Preço unitário
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "unit_price",
                                event.target.value
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                        <span className="text-sm text-gray-500">
                          Total do item
                        </span>

                        <span className="font-semibold text-gray-900">
                          {formatCurrency(
                            item.quantity * item.unit_price
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Desconto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Desconto
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">
                  R$
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(event) =>
                    setDiscount(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Observações
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={4}
                placeholder="Observações do orçamento..."
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Resumo */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Subtotal
                </span>

                <span className="font-semibold text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Desconto
                </span>

                <span className="font-semibold text-red-600">
                  - {formatCurrency(discountValue)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/orcamentos")}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}