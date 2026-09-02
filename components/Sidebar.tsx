"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "🏠",
  },
  {
    label: "Orçamentos",
    href: "/orcamentos",
    icon: "📄",
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: "👥",
  },
  {
    label: "Serviços",
    href: "/servicos",
    icon: "🔧",
  },
  {
    label: "Empresa",
    href: "/empresa",
    icon: "🏢",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-gray-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ⚡
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">
                OrçaFácil
              </p>

              <p className="text-xs text-gray-500">
                Gestão de orçamentos
              </p>
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="text-lg">
              🚪
            </span>

            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Navegação mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white lg:hidden">
        <div className="grid grid-cols-5">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-center transition ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span className="text-[10px] font-semibold">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

