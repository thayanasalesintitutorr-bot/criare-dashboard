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
  href: '/marketing',
  label: 'Marketing',
  icon: Megaphone,
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


  return (
  <>
    <div className="fixed left-0 top-0 z-40 h-screen w-4" />
    <aside
  className="
    group
    fixed
    left-0
    top-0
    z-50
    h-screen
    w-[0px]
    hover:w-[235px]
    overflow-hidden
    border-r
    border-black/5
    bg-[#04152d]
    text-white
    transition-all
    duration-300
    dark:border-white/5
  "
>
  
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center justify-center group-hover:justify-between px-5">
          <div className="hidden group-hover:block">
            <div className="text-2xl font-black tracking-[-0.04em] text-[var(--accent)]">
              Criare
            </div>
          </div>

          
        </div>

        <nav className="flex-1 space-y-2 px-3 pb-6">
          {items.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon

            return (
              <Link
  key={item.href}
  href={item.href}
  className={`flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-4 py-3 text-sm transition ${
    active
      ? 'bg-white/12 text-white'
      : 'text-white/70 hover:bg-white/8 hover:text-white'
  }`}
>
                <Icon
  size={18}
  className={item.href === '/marketing' ? 'text-[var(--accent)]' : ''}
/>
                <span
  className="
    hidden
    group-hover:block
    whitespace-nowrap
  "
>
  {item.label}
</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
      </>
)
}
