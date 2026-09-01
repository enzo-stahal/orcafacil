"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("E-mail ou senha incorretos.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fa] px-4 py-10">

      {/* Elementos decorativos do fundo */}
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-yellow-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl shadow-lg">
            ⚡
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            OrçaFácil
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Organize seus orçamentos de forma simples
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-200/50 sm:p-8">

          <div className="mb-7">
            <h2 className="text-xl font-semibold text-gray-900">
              Bem-vindo de volta!
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Entre na sua conta para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* E-mail */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
              />
            </div>

            {/* Senha */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-100"
              />
            </div>

            {/* Erro */}
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

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Cadastro */}
          <div className="mt-7 border-t border-gray-100 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Ainda não tem uma conta?{" "}
              <a
                href="/cadastro"
                className="font-semibold text-gray-900 underline-offset-4 transition hover:underline"
              >
                Criar conta
              </a>
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Simples. Rápido. Organizado.
        </p>
      </div>
    </main>
  )
}