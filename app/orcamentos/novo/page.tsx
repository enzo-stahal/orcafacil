"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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

type QuoteItem = {
  id: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
}

const supabase = createClient()

export default function NovoOrcamentoPage() {
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [customerId, setCustomerId] = useState("")
  const [selectedServiceId, setSelectedServiceId] = useState("")
  const [quantity, setQuantity] = useState("1")

  const [items, setItems] = useState<QuoteItem[]>([])

  const [discount, setDiscount] = useState("0")
  const [notes, setNotes] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError("")

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (!active) return

      if (authError) {
        setError(`Erro de autenticação: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!user) {
        router.push("/login")
        return
      }

      const { data: customersData, error: customersError } =
        await supabase
          .from("customers")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name")

      if (!active) return

      if (customersError) {
        setError(
          `Erro ao carregar clientes: ${customersError.message}`
        )
        setLoading(false)
        return
      }

      const { data: servicesData, error: servicesError } =
        await supabase
          .from("services")
          .select("id, name, description, price")
          .eq("user_id", user.id)
          .order("name")

      if (!active) return

      if (servicesError) {
        setError(
          `Erro ao carregar serviços: ${servicesError.message}`
        )
        setLoading(false)
        return
      }

      setCustomers(customersData || [])

      setServices(
        (servicesData || []).map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: Number(service.price),
        }))
      )

      setLoading(false)
    }

    loadData()

    return () => {
      active = false
    }
  }, [router])

  function addItem() {
    setError("")

    if (!selectedServiceId) {
      setError("Selecione um serviço.")
      return
    }

    const selectedService = services.find(
      (service) => service.id === selectedServiceId
    )

    if (!selectedService) {
      setError("Serviço selecionado não encontrado.")
      return
    }

    const parsedQuantity = Number(quantity.replace(",", "."))

    if (!parsedQuantity || parsedQuantity <= 0) {
      setError("Informe uma quantidade válida.")
      return
    }

    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      service_id: selectedService.id,
      description:
        selectedService.description || selectedService.name,
      quantity: parsedQuantity,
      unit_price: selectedService.price,
    }

    setItems((currentItems) => [...currentItems, newItem])

    setSelectedServiceId("")
    setQuantity("1")
  }

  function changeQuantity(id: string, value: string) {
    const parsedValue = Number(value.replace(",", "."))

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                parsedValue > 0 ? parsedValue : 0,
            }
          : item
      )
    )
  }

  function changePrice(id: string, value: string) {
    const parsedValue = Number(value.replace(",", "."))

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              unit_price:
                parsedValue >= 0 ? parsedValue : 0,
            }
          : item
      )
    )
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    )
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price
    }, 0)
  }, [items])

  const discountValue = useMemo(() => {
    const value = Number(discount.replace(",", "."))

    if (Number.isNaN(value) || value < 0) {
      return 0
    }

    return value
  }, [discount])

  const total = useMemo(() => {
    return Math.max(subtotal - discountValue, 0)
  }, [subtotal, discountValue])

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!customerId) {
      setError("Selecione um cliente.")
      return
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um serviço ao orçamento.")
      return
    }

    if (discountValue > subtotal) {
      setError(
        "O desconto não pode ser maior que o subtotal."
      )
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      setError(
        authError?.message ||
          "Não foi possível identificar o usuário."
      )
      setSaving(false)
      return
    }

    const quoteData = {
      user_id: user.id,
      customer_id: customerId,
      status: "draft",
      subtotal: subtotal,
      discount: discountValue,
      total: total,
      notes: notes.trim() || null,
    }

    const {
      data: quote,
      error: quoteError,
    } = await supabase
      .from("quotes")
      .insert(quoteData)
      .select("*")
      .single()

    if (quoteError || !quote) {
      setError(
        `Não foi possível criar o orçamento: ${
          quoteError?.message || "Erro desconhecido."
        }`
      )
      setSaving(false)
      return
    }

    const quoteItems = items.map((item) => ({
      quote_id: quote.id,
      service_id: item.service_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase
      .from("quote_items")
      .insert(quoteItems)

    if (itemsError) {
      await supabase
        .from("quotes")
        .delete()
        .eq("id", quote.id)

      setError(
        `Erro ao salvar os serviços do orçamento: ${itemsError.message}`
      )
      setSaving(false)
      return
    }

    setSuccess("Orçamento criado com sucesso!")

    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Carregando dados...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-4 text-sm text-gray-500 underline hover:text-black"
          >
            ← Voltar para o dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Novo orçamento
          </h1>

          <p className="mt-2 text-gray-600">
            Crie um orçamento profissional para seu cliente.
          </p>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Cliente */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Cliente
            </h2>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Selecione o cliente
              </label>

              <select
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="">
                  Selecione um cliente
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                  </option>
                ))}
              </select>

              {customers.length === 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  Você ainda não possui clientes cadastrados.
                </p>
              )}
            </div>
          </div>

          {/* Serviços */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Serviços
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_140px_auto]">

              <select
                value={selectedServiceId}
                onChange={(event) =>
                  setSelectedServiceId(event.target.value)
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="">
                  Selecione um serviço
                </option>

                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name} —{" "}
                    {formatCurrency(service.price)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                placeholder="Quantidade"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
              >
                Adicionar
              </button>
            </div>

            {services.length === 0 && (
              <p className="mt-4 text-sm text-gray-500">
                Você ainda não possui serviços cadastrados.
              </p>
            )}

            {/* Lista de itens */}
            {items.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">

                <div className="hidden grid-cols-[1fr_120px_150px_150px_50px] gap-4 border-b bg-gray-50 p-4 text-sm font-medium text-gray-600 md:grid">
                  <span>Serviço</span>
                  <span>Quantidade</span>
                  <span>Valor unitário</span>
                  <span>Total</span>
                  <span></span>
                </div>

                <div className="divide-y divide-gray-200">

                  {items.map((item) => {
                    const itemTotal =
                      item.quantity * item.unit_price

                    return (
                      <div
                        key={item.id}
                        className="grid gap-4 p-4 md:grid-cols-[1fr_120px_150px_150px_50px] md:items-center"
                      >

                        <div>
                          <p className="font-medium text-gray-900">
                            {item.description}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-gray-500 md:hidden">
                            Quantidade
                          </label>

                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              changeQuantity(
                                item.id,
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-gray-500 md:hidden">
                            Valor unitário
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) =>
                              changePrice(
                                item.id,
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-gray-500 md:hidden">
                            Total
                          </label>

                          <p className="font-semibold text-gray-900">
                            {formatCurrency(itemTotal)}
                          </p>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </div>

                      </div>
                    )
                  })}

                </div>
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Resumo do orçamento
            </h2>

            <div className="mt-6 ml-auto max-w-md space-y-4">

              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Desconto */}
              <div className="flex items-center justify-between gap-6">
                <label
                  htmlFor="discount"
                  className="text-gray-600"
                >
                  Desconto
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    R$
                  </span>

                  <input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) =>
                      setDiscount(event.target.value)
                    }
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-right outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Observações */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Observações
            </h2>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              placeholder="Adicione informações importantes sobre o orçamento..."
              className="mt-4 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {/* Botões */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Salvando..."
                : "Criar orçamento"}
            </button>

          </div>

        </form>
      </div>
    </main>
  )
}

