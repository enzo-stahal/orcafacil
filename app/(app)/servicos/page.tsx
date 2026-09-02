"use client"

import { FormEvent, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Service = {
  id: string
  user_id: string
  name: string
  description: string | null
  price: number
  created_at: string
  updated_at: string
}

export default function ServicosPage() {
  const supabase = createClient()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")

  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // =========================================================
  // FORMATAR PREÇO
  // =========================================================

  function formatPrice(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // =========================================================
  // BUSCAR SERVIÇOS
  // =========================================================

  async function loadServices() {
    setLoading(true)
    setError("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      window.location.href = "/login"
      return
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar serviços:", error)
      setError(error.message)
      setLoading(false)
      return
    }

    setServices((data || []) as Service[])
    setLoading(false)
  }

  // Carregar serviços quando a página abrir
  useEffect(() => {
    loadServices()
  }, [])

  // =========================================================
  // LIMPAR FORMULÁRIO
  // =========================================================

  function clearForm() {
    setName("")
    setDescription("")
    setPrice("")
  }

  // =========================================================
  // CADASTRAR SERVIÇO
  // =========================================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError("")
    setMessage("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError("Sua sessão expirou. Faça login novamente.")
      setSaving(false)
      return
    }

    if (!name.trim()) {
      setError("Digite o nome do serviço.")
      setSaving(false)
      return
    }

    // Converte o preço digitado para número
    const normalizedPrice = price
      .replace(/\./g, "")
      .replace(",", ".")

    const numericPrice = Number(normalizedPrice)

    if (price.trim() === "" || Number.isNaN(numericPrice)) {
      setError("Digite um preço válido.")
      setSaving(false)
      return
    }

    if (numericPrice < 0) {
      setError("O preço não pode ser negativo.")
      setSaving(false)
      return
    }

    const serviceData = {
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      price: numericPrice,
    }

    const {
      data: newService,
      error: insertError,
    } = await supabase
      .from("services")
      .insert(serviceData)
      .select("*")
      .single()

    if (insertError) {
      console.error("Erro ao salvar serviço:", insertError)
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Adiciona o serviço imediatamente na lista
    if (newService) {
      setServices((currentServices) => [
        newService as Service,
        ...currentServices,
      ])
    }

    clearForm()

    setMessage("Serviço cadastrado com sucesso!")
    setSaving(false)
    setShowForm(false)
  }

  // =========================================================
  // EXCLUIR SERVIÇO
  // =========================================================

  async function deleteService(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este serviço?"
    )

    if (!confirmed) {
      return
    }

    setError("")
    setMessage("")

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir serviço:", error)
      setError(error.message)
      return
    }

    // Remove imediatamente da tela
    setServices((currentServices) =>
      currentServices.filter((service) => service.id !== id)
    )

    setMessage("Serviço excluído com sucesso!")
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] px-4 py-8 sm:px-6 sm:py-10">

      {/* Elementos decorativos */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-yellow-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">

        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

          <div>

            <a
              href="/dashboard"
              className="flex w-fit items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-black"
            >
              <span className="text-lg">←</span>
              Voltar para o dashboard
            </a>

            <div className="mt-6 flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-xl shadow-lg">
                ⚡
              </div>

              <div>

                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Serviços
                </h1>

                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Cadastre e gerencie seus serviços.
                </p>

              </div>

            </div>

          </div>

          {/* Botão novo serviço */}
          <button
            onClick={() => {
              setShowForm(!showForm)
              setMessage("")
              setError("")
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl"
          >

            {showForm ? (
              <>
                <span>×</span>
                Cancelar
              </>
            ) : (
              <>
                <span className="text-lg leading-none">+</span>
                Novo serviço
              </>
            )}

          </button>

        </div>

        {/* =====================================================
            MENSAGEM DE ERRO
        ====================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">

            <span className="mt-0.5 text-sm">
              ⚠️
            </span>

            <p className="text-sm leading-5 text-red-600">
              {error}
            </p>

          </div>
        )}

        {/* =====================================================
            MENSAGEM DE SUCESSO
        ====================================================== */}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">

            <span className="mt-0.5 text-sm">
              ✓
            </span>

            <p className="text-sm leading-5 text-green-700">
              {message}
            </p>

          </div>
        )}

        {/* =====================================================
            FORMULÁRIO
        ====================================================== */}

        {showForm && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">

            <div className="border-b border-gray-100 px-6 py-6 sm:px-8">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
                  ⚡
                </div>

                <div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Novo serviço
                  </h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Adicione um serviço que você oferece.
                  </p>

                </div>

              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 px-6 py-7 sm:px-8 sm:py-8"
            >

              {/* Nome */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nome do serviço
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Instalação de tomada"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                />

              </div>

              {/* Descrição */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Descrição
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o que está incluído no serviço..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                />

              </div>

              {/* Preço */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Preço
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    R$
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="0,00"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Digite o valor normalmente. Exemplo: 150,00
                </p>

              </div>

              {/* Botão salvar */}
              <button
                type="submit"
                disabled={saving}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
              >

                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Cadastrar serviço

                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}

              </button>

            </form>

          </div>
        )}

        {/* =====================================================
            LISTA DE SERVIÇOS
        ====================================================== */}

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">

          {/* Cabeçalho da lista */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 sm:px-8">

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Seus serviços
              </h2>

              <p className="mt-1 text-sm text-gray-500">

                {services.length === 0
                  ? "Nenhum serviço cadastrado"
                  : `${services.length} ${
                      services.length === 1
                        ? "serviço cadastrado"
                        : "serviços cadastrados"
                    }`}

              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
              ⚡
            </div>

          </div>

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading ? (

            <div className="flex flex-col items-center justify-center px-6 py-16">

              <span className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

              <p className="text-sm text-gray-500">
                Carregando serviços...
              </p>

            </div>

          ) : services.length === 0 ? (

            /* =====================================================
               ESTADO VAZIO
            ====================================================== */

            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                ⚡
              </div>

              <h3 className="font-semibold text-gray-900">
                Nenhum serviço ainda
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Você ainda não possui serviços cadastrados. Comece adicionando seu primeiro serviço.
              </p>

              <button
                onClick={() => {
                  setShowForm(true)
                  setMessage("")
                  setError("")
                }}
                className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                + Cadastrar primeiro serviço
              </button>

            </div>

          ) : (

            /* =====================================================
               SERVIÇOS
            ====================================================== */

            <div className="divide-y divide-gray-100">

              {services.map((service) => (

                <div
                  key={service.id}
                  className="group flex flex-col gap-5 px-6 py-6 transition hover:bg-gray-50 sm:px-8 md:flex-row md:items-center md:justify-between"
                >

                  <div className="flex min-w-0 items-start gap-4">

                    {/* Ícone */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
                      ⚡
                    </div>

                    <div className="min-w-0">

                      <h3 className="font-semibold text-gray-900">
                        {service.name}
                      </h3>

                      {service.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-5 text-gray-500">
                          {service.description}
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">

                    {/* Preço */}
                    <div className="text-right">

                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Preço
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatPrice(Number(service.price))}
                      </p>

                    </div>

                    {/* Excluir */}
                    <button
                      onClick={() => deleteService(service.id)}
                      className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <span>🗑</span>
                      Excluir
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* =====================================================
            RODAPÉ
        ====================================================== */}

        <p className="mt-6 text-center text-xs text-gray-400">
          ⚡ OrçaFácil · Gerencie seus serviços de forma simples
        </p>

      </div>

    </main>
  )
}

