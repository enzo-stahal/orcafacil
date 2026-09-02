"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type DeleteQuoteButtonProps = {
  quoteId: string
}

const supabase = createClient()

export default function DeleteQuoteButton({
  quoteId,
}: DeleteQuoteButtonProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este orçamento?\n\nEssa ação não poderá ser desfeita."
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", quoteId)

    if (error) {
      console.error("Erro ao excluir orçamento:", error)

      alert("Não foi possível excluir o orçamento.")

      setDeleting(false)

      return
    }

    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Excluindo..." : "Excluir"}
    </button>
  )
}