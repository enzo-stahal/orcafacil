"use client"

import { FormEvent, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Customer = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  document: string | null
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export default function ClientesPage() {
  const supabase = createClient()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [document, setDocument] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [notes, setNotes] = useState("")

  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // =========================================================
  // BUSCAR CLIENTES
  // =========================================================

  async function loadCustomers() {
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
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar clientes:", error)
      setError(error.message)
      setLoading(false)
      return
    }

    setCustomers((data || []) as Customer[])
    setLoading(false)
  }

  // Carrega os clientes quando a página abre
  useEffect(() => {
    loadCustomers()
  }, [])

  // =========================================================
  // LIMPAR FORMULÁRIO
  // =========================================================

  function clearForm() {
    setName("")
    setEmail("")
    setPhone("")
    setWhatsapp("")
    setDocument("")
    setAddress("")
    setCity("")
    setState("")
    setNotes("")
  }

  // =========================================================
  // CADASTRAR CLIENTE
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
      setError("Digite o nome do cliente.")
      setSaving(false)
      return
    }

    const customerData = {
      user_id: user.id,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      document: document.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim().toUpperCase() || null,
      notes: notes.trim() || null,
    }

    const {
      data: newCustomer,
      error: insertError,
    } = await supabase
      .from("customers")
      .insert(customerData)
      .select("*")
      .single()

    if (insertError) {
      console.error("Erro ao salvar cliente:", insertError)
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Adiciona o novo cliente imediatamente na lista
    if (newCustomer) {
      setCustomers((currentCustomers) => [
        newCustomer as Customer,
        ...currentCustomers,
      ])
    }

    clearForm()

    setMessage("Cliente cadastrado com sucesso!")
    setSaving(false)
    setShowForm(false)
  }

  // =========================================================
  // EXCLUIR CLIENTE
  // =========================================================

  async function deleteCustomer(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este cliente?"
    )

    if (!confirmed) {
      return
    }

    setError("")
    setMessage("")

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir cliente:", error)
      setError(error.message)
      return
    }

    // Remove imediatamente da tela
    setCustomers((currentCustomers) =>
      currentCustomers.filter((customer) => customer.id !== id)
    )

    setMessage("Cliente excluído com sucesso!")
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
                👥
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Clientes
                </h1>

                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Cadastre e gerencie seus clientes.
                </p>
              </div>

            </div>
          </div>

          {/* Botão novo cliente */}
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
                Novo cliente
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
                  👤
                </div>

                <div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Novo cliente
                  </h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    Adicione as informações do seu cliente.
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
                  Nome
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nome completo ou empresa"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                />

              </div>

              {/* E-mail e documento */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    CPF / CNPJ
                  </label>

                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

              </div>

              {/* Telefone e WhatsApp */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Telefone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    WhatsApp
                  </label>

                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

              </div>

              {/* Endereço */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Endereço
                </label>

                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                />

              </div>

              {/* Cidade e estado */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Cidade
                  </label>

                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Estado
                  </label>

                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm uppercase text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                  />

                </div>

              </div>

              {/* Observações */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Observações
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
                />

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
                    Cadastrar cliente

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
            LISTA DE CLIENTES
        ====================================================== */}

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">

          {/* Cabeçalho da lista */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 sm:px-8">

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Seus clientes
              </h2>

              <p className="mt-1 text-sm text-gray-500">

                {customers.length === 0
                  ? "Nenhum cliente cadastrado"
                  : `${customers.length} ${
                      customers.length === 1
                        ? "cliente cadastrado"
                        : "clientes cadastrados"
                    }`}

              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg">
              👥
            </div>

          </div>

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading ? (

            <div className="flex flex-col items-center justify-center px-6 py-16">

              <span className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />

              <p className="text-sm text-gray-500">
                Carregando clientes...
              </p>

            </div>

          ) : customers.length === 0 ? (

            /* =====================================================
               ESTADO VAZIO
            ====================================================== */

            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                👤
              </div>

              <h3 className="font-semibold text-gray-900">
                Nenhum cliente ainda
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Você ainda não possui clientes cadastrados. Comece adicionando seu primeiro cliente.
              </p>

              <button
                onClick={() => {
                  setShowForm(true)
                  setMessage("")
                  setError("")
                }}
                className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                + Cadastrar primeiro cliente
              </button>

            </div>

          ) : (

            /* =====================================================
               CLIENTES
            ====================================================== */

            <div className="divide-y divide-gray-100">

              {customers.map((customer) => (

                <div
                  key={customer.id}
                  className="group flex flex-col gap-5 px-6 py-6 transition hover:bg-gray-50 sm:px-8 md:flex-row md:items-center md:justify-between"
                >

                  <div className="flex min-w-0 items-start gap-4">

                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">

                      <h3 className="truncate font-semibold text-gray-900">
                        {customer.name}
                      </h3>

                      <div className="mt-2 space-y-1">

                        {customer.email && (
                          <p className="text-sm text-gray-500">
                            ✉ {customer.email}
                          </p>
                        )}

                        {customer.phone && (
                          <p className="text-sm text-gray-500">
                            ☎ Telefone: {customer.phone}
                          </p>
                        )}

                        {customer.whatsapp && (
                          <p className="text-sm text-gray-500">
                            💬 WhatsApp: {customer.whatsapp}
                          </p>
                        )}

                        {customer.document && (
                          <p className="text-sm text-gray-500">
                            🪪 {customer.document}
                          </p>
                        )}

                        {customer.city && (
                          <p className="text-sm text-gray-500">
                            📍 {customer.city}
                            {customer.state && ` - ${customer.state}`}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* Excluir */}
                  <button
                    onClick={() => deleteCustomer(customer.id)}
                    className="flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <span>🗑</span>
                    Excluir
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* =====================================================
            RODAPÉ
        ====================================================== */}

        <p className="mt-6 text-center text-xs text-gray-400">
          ⚡ OrçaFácil · Gerencie seus clientes de forma simples
        </p>

      </div>

    </main>
  )
}
