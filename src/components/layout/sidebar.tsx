'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
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
    href: '/vendas',
    label: 'Vendas',
    icon: DollarSign,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-black/5 bg-[#04152d] text-white transition-all dark:border-white/5 ${
        collapsed ? 'w-[92px]' : 'w-[280px]'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-6">
          <div className={`${collapsed ? 'hidden' : 'block'}`}>
            <div className="text-2xl font-black tracking-[-0.04em] text-[var(--accent)]">
              Criare
            </div>
          </div>

          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/15"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-3 pb-6">
          {items.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}