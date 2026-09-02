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

      // Usuário não autenticado
      if (authError || !user) {
        router.replace("/login")
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
              quantity: parsedValue > 0 ? parsedValue : 0,
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
              unit_price: parsedValue >= 0 ? parsedValue : 0,
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
      router.replace("/login")
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
      <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] px-4 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl text-white">
                ⚡
              </div>

              <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

              <p className="font-medium text-gray-900">
                Carregando dados...
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Estamos preparando seu orçamento.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-yellow-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">

        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-black"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Voltar para o dashboard
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
                <span className="text-sm">⚡</span>
                ORÇAFÁCIL
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Novo orçamento
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                Crie um orçamento profissional para seu cliente.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:block">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total atual
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-bold">
              !
            </div>

            <div>
              <p className="font-semibold">
                Não foi possível continuar
              </p>

              <p className="mt-0.5 text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 font-bold">
              ✓
            </div>

            <div>
              <p className="font-semibold">
                Tudo certo!
              </p>

              <p className="mt-0.5 text-green-600">
                {success}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                👤
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Cliente
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Escolha para quem este orçamento será destinado.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Selecione o cliente
              </label>

              <select
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
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
                <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Você ainda não possui clientes cadastrados.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/clientes")}
                    className="mt-2 text-sm font-semibold text-gray-900 underline underline-offset-4"
                  >
                    Cadastrar cliente
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                🧾
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Serviços
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Adicione os serviços que farão parte do orçamento.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_140px_auto]">
              <select
                value={selectedServiceId}
                onChange={(event) =>
                  setSelectedServiceId(event.target.value)
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
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
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
              />

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg"
              >
                + Adicionar
              </button>
            </div>

            {services.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Você ainda não possui serviços cadastrados.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/servicos")}
                  className="mt-2 text-sm font-semibold text-gray-900 underline underline-offset-4"
                >
                  Cadastrar serviço
                </button>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-7 overflow-hidden rounded-2xl border border-gray-200">

                <div className="hidden grid-cols-[1fr_120px_150px_150px_70px] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500 md:grid">
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
                        className="grid gap-5 bg-white p-5 transition hover:bg-gray-50/70 md:grid-cols-[1fr_120px_150px_150px_70px] md:items-center"
                      >
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs font-medium text-gray-400 md:hidden">
                            Serviço
                          </label>

                          <p className="font-semibold text-gray-900">
                            {item.description}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400 md:hidden">
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
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-400 md:hidden">
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
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-400 md:hidden">
                            Total
                          </label>

                          <p className="font-bold text-gray-950">
                            {formatCurrency(itemTotal)}
                          </p>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="rounded-lg px-2 py-1 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      {items.length}{" "}
                      {items.length === 1
                        ? "item adicionado"
                        : "itens adicionados"}
                    </span>

                    <span className="text-sm font-bold text-gray-900">
                      Subtotal: {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                💰
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Resumo do orçamento
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Confira os valores antes de criar o orçamento.
                </p>
              </div>
            </div>

            <div className="mt-7 ml-auto max-w-md">
              <div className="space-y-4">

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="discount"
                    className="text-sm font-medium text-gray-600"
                  >
                    Desconto
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
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
                      style={{
                        color: "#111827",
                        backgroundColor: "#ffffff",
                        WebkitTextFillColor: "#111827",
                        opacity: 1,
                      }}
                      className="w-32 rounded-xl border border-gray-300 px-3 py-2.5 text-right text-sm font-medium outline-none transition focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-950 p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">
                        Total do orçamento
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Já considerando o desconto
                      </p>
                    </div>

                    <span className="text-2xl font-bold sm:text-3xl">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                📝
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Observações
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Adicione informações extras para seu cliente.
                </p>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              placeholder="Adicione informações importantes sobre o orçamento..."
              className="mt-6 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Criar orçamento
                </>
              )}
            </button>
          </div>
        </form>

        <div className="py-8 text-center">
          <p className="text-xs text-gray-400">
            OrçaFácil • Gestão simples e profissional
          </p>
        </div>
      </div>
    </main>
  )
}