"use client"

import { useRouter } from "next/navigation"

export default function QuickActions() {
  const router = useRouter()

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <button
        onClick={() => router.push("/orcamentos/novo")}
        className="rounded-xl bg-black px-6 py-4 text-left text-white transition hover:bg-gray-800"
      >
        <p className="font-semibold">
          + Novo orçamento
        </p>

        <p className="mt-1 text-sm text-gray-300">
          Crie um orçamento para seu cliente
        </p>
      </button>

      <button
        onClick={() => router.push("/clientes")}
        className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-left transition hover:bg-gray-50"
      >
        <p className="font-semibold text-gray-900">
          + Novo cliente
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Cadastre seus clientes
        </p>
      </button>

      <button
        onClick={() => router.push("/servicos")}
        className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-left transition hover:bg-gray-50"
      >
        <p className="font-semibold text-gray-900">
          + Novo serviço
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Cadastre seus serviços
        </p>
      </button>
    </div>
  )
}

