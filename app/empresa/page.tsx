"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function EmpresaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [companyId, setCompanyId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [document, setDocument] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  useEffect(() => {
    async function loadCompany() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        setError("Não foi possível carregar os dados da empresa.")
        setLoading(false)
        return
      }

      if (data) {
        setCompanyId(data.id)
        setName(data.name || "")
        setDocument(data.document || "")
        setPhone(data.phone || "")
        setWhatsapp(data.whatsapp || "")
        setAddress(data.address || "")
        setCity(data.city || "")
        setState(data.state || "")
      }

      setLoading(false)
    }

    loadCompany()
  }, [router, supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setMessage("")
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    const companyData = {
      user_id: user.id,
      name,
      document,
      phone,
      whatsapp,
      address,
      city,
      state,
    }

    let result

    if (companyId) {
      result = await supabase
        .from("companies")
        .update(companyData)
        .eq("id", companyId)
    } else {
      result = await supabase
        .from("companies")
        .insert(companyData)
        .select()
        .single()
    }

    if (result.error) {
      console.error(result.error)
      setError("Não foi possível salvar os dados da empresa.")
      setSaving(false)
      return
    }

    if (result.data) {
      setCompanyId(result.data.id)
    }

    setMessage("Dados da empresa salvos com sucesso!")
    setSaving(false)

    router.push("/dashboard")
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl shadow-lg">
            ⚡
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
            Carregando...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] px-4 py-8 sm:px-6 sm:py-10">

      {/* Elementos decorativos do fundo */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-yellow-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">

        {/* Cabeçalho */}
        <div className="mb-8">

          <button
            onClick={() => router.push("/dashboard")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-black"
          >
            <span className="text-lg">←</span>
            Voltar para o dashboard
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-xl shadow-lg">
              ⚡
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Minha empresa
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
                Essas informações aparecerão nos seus orçamentos.
              </p>
            </div>
          </div>
        </div>

        {/* Card principal */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">

          {/* Cabeçalho do formulário */}
          <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Informações da empresa
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Mantenha os dados atualizados para utilizá-los nos seus orçamentos.
            </p>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-7 sm:px-8 sm:py-8"
          >

            {/* Nome */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nome da empresa
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex.: Elétrica Silva"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
              />
            </div>

            {/* CPF / CNPJ */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                CPF / CNPJ
              </label>

              <input
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Ex.: 12.345.678/0001-90"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
              />
            </div>

            {/* Telefones */}
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

            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <span className="mt-0.5 text-sm">
                  ⚠️
                </span>

                <p className="text-sm leading-5 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* Mensagem de sucesso */}
            {message && (
              <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <span className="mt-0.5 text-sm">
                  ✓
                </span>

                <p className="text-sm leading-5 text-green-700">
                  {message}
                </p>
              </div>
            )}

            {/* Botão */}
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
                  Salvar empresa
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Rodapé */}
        <p className="mt-6 text-center text-xs text-gray-400">
          ⚡ OrçaFácil · Seus dados ficam vinculados à sua conta
        </p>

      </div>
    </main>
  )
}

