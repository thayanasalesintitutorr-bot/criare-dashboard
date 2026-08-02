'use client'

import {
  LayoutDashboard,
  Megaphone,
  Filter,
  DollarSign,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSessionRole } from '@/store/use-session-role'

const items = [
  {
    href: '/dashboard',
    label: 'Visão Geral',
    icon: LayoutDashboard,
  },
  {
    href: '/funil',
    label: 'Consultas',
    icon: Filter,
  },
  {
  href: '/marketing',
  label: 'Marketing',
  icon: Megaphone,
},
  {
    href: '/vendas',
    label: 'Vendas',
    icon: DollarSign,
  },
  {
    href: '/conversas',
    label: 'Conversas',
    icon: MessageSquare,
  },
]

function useItensVisiveis() {
  const pathname = usePathname()
  const { role, fetchRole } = useSessionRole()

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  const itensVisiveis = items.filter((item) => {
    if (role === 'marketing') {
      return item.href === '/marketing'
    }

    return true
  })

  return { pathname, itensVisiveis }
}

// A partir de tablet-h (1024px, tablet deitado) usamos a barra lateral que
// expande no hover — funciona bem com mouse. Abaixo disso (celular e tablet
// em pé, onde não existe hover confiável) trocamos para uma barra inferior
// fixa, mais comum e acessível em telas de toque.
export function Sidebar() {
  const { pathname, itensVisiveis } = useItensVisiveis()

  return (
    <aside
      className="
        group
        fixed
        left-0
        top-0
        z-50
        hidden
        h-screen
        w-[76px]
        flex-col
        overflow-hidden
        border-r
        border-[var(--border)]
        bg-[var(--sidebar)]
        text-[var(--sidebar-foreground)]
        transition-[width]
        duration-300
        ease-out
        hover:w-[235px]
        hover:shadow-[8px_0_30px_rgba(0,0,0,0.25)]
        tablet-h:flex
      "
    >
      <div className="flex h-full flex-col">
        <div className="flex h-20 shrink-0 items-center px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-[var(--background)]">
            C
          </div>

          <div className="ml-3 max-w-0 overflow-hidden whitespace-nowrap text-2xl font-black tracking-[-0.04em] text-[var(--accent)] opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100">
            Criare
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 pb-6">
          {itensVisiveis.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`relative flex items-center gap-3 rounded-2xl px-[15px] py-3 text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? 'bg-[var(--sidebar-active)] text-[var(--accent)]'
                      : 'text-white/60 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                  )}

                  <Icon size={18} className="shrink-0" />

                  <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100">
                    {item.label}
                  </span>
                </Link>
              )
            })}
        </nav>
      </div>
    </aside>
  )
}

export function MobileBottomNav() {
  const { pathname, itensVisiveis } = useItensVisiveis()

  return (
    <nav
      className="
        fixed
        inset-x-0
        bottom-0
        z-50
        flex
        h-16
        items-center
        justify-around
        border-t
        border-[var(--border)]
        bg-[var(--sidebar)]
        px-1
        pb-[env(safe-area-inset-bottom)]
        tablet-h:hidden
      "
    >
      {itensVisiveis.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors duration-200 ${
              active ? 'text-[var(--accent)]' : 'text-white/50'
            }`}
          >
            <Icon size={19} className="shrink-0" />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
