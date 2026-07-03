'use client'

import {
  LayoutDashboard,
  Megaphone,
  Filter,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="
        group
        fixed
        left-0
        top-0
        z-50
        flex
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
          {items
            .filter((item) => {
              if (typeof document === 'undefined') return true

              const isMarketingUser = document.cookie.includes('criare-auth=marketing')

              if (isMarketingUser) {
                return item.href === '/marketing'
              }

              return true
            })
            .map((item) => {
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
