"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type StatusSelectProps = {
  quoteId: string
  initialStatus: string
}

const supabase = createClient()

export default function StatusSelect({
  quoteId,
  initialStatus,
}: StatusSelectProps) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)

  async function handleChange(newStatus: string) {
    const previousStatus = status

    setStatus(newStatus)
    setSaving(true)

    const { error } = await supabase
      .from("quotes")
      .update({
        status: newStatus,
      })
      .eq("id", quoteId)

    setSaving(false)

    if (error) {
      console.error("Erro ao atualizar status:", error)

      setStatus(previousStatus)

      alert("Não foi possível atualizar o status.")
    }
  }

  return (
    <select
      value={status}
      onChange={(event) => handleChange(event.target.value)}
      disabled={saving}
      className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ring-0 transition ${
        status === "draft"
          ? "bg-gray-100 text-gray-700"
          : status === "sent"
            ? "bg-blue-100 text-blue-700"
            : status === "approved"
              ? "bg-green-100 text-green-700"
              : status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
      } ${saving ? "cursor-wait opacity-60" : "cursor-pointer"}`}
    >
      <option value="draft">Rascunho</option>
      <option value="sent">Enviado</option>
      <option value="approved">Aprovado</option>
      <option value="rejected">Recusado</option>
    </select>
  )
}