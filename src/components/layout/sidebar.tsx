'use client'

import {
  LayoutDashboard,
  Megaphone,
  Filter,
  DollarSign,
  ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
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
    label: 'Protocolos',
    icon: ClipboardList,
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

// A partir de tablet-h (1024px, tablet deitado) a navegação vira um "dock"
// flutuante embaixo da tela: os ícones crescem conforme o mouse se aproxima
// (efeito lupa), a pílula do item ativo desliza entre as páginas e o nome
// aparece num balão ao passar o mouse. Abaixo disso (celular e tablet em
// pé, sem hover confiável) continua a barra inferior fixa de sempre.
function DockItem({
  item,
  ativo,
  mouseX,
}: {
  item: (typeof items)[number]
  ativo: boolean
  mouseX: MotionValue<number>
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const Icon = item.icon

  const distancia = useTransform(mouseX, (x) => {
    const caixa = ref.current?.getBoundingClientRect()
    if (!caixa) return 1000
    return x - (caixa.x + caixa.width / 2)
  })
  const tamanho = useSpring(useTransform(distancia, [-150, 0, 150], [48, 72, 48]), {
    mass: 0.1,
    stiffness: 220,
    damping: 15,
  })

  return (
    <Link ref={ref} href={item.href} aria-label={item.label} className="group relative flex flex-col items-center">
      <span className="pointer-events-none absolute -top-11 whitespace-nowrap rounded-xl border border-white/10 bg-[var(--card)]/90 px-3 py-1.5 text-[13px] font-semibold text-[var(--foreground)] opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
        {item.label}
      </span>

      <motion.div
        style={{ width: tamanho, height: tamanho }}
        className={`relative flex items-center justify-center rounded-2xl border transition-colors ${
          ativo
            ? 'border-white/20 text-white'
            : 'border-white/[0.07] bg-white/[0.05] text-white/65 group-hover:text-white'
        }`}
        whileTap={{ scale: 0.92 }}
      >
        {ativo && (
          <motion.span
            layoutId="dock-ativo"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3B82F6] via-[#7C6CF0] to-[#A855F7] shadow-[0_8px_24px_rgba(99,102,241,0.55)]"
          />
        )}
        <Icon className="relative h-[46%] w-[46%]" strokeWidth={2.2} />
      </motion.div>

      <span
        className={`mt-1.5 h-1 w-1 rounded-full transition-all duration-300 ${
          ativo ? 'bg-[#A855F7] shadow-[0_0_8px_#A855F7]' : 'bg-transparent'
        }`}
      />
    </Link>
  )
}

export function Sidebar() {
  const { pathname, itensVisiveis } = useItensVisiveis()
  const mouseX = useMotionValue(Infinity)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 hidden justify-center tablet-h:flex">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.2 }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex items-end gap-3 rounded-[28px] border border-white/10 bg-[var(--sidebar)]/70 px-4 pb-2.5 pt-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mb-[18px] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#60A5FA] to-[#C084FC] text-sm font-black text-[#05070D] shadow-[0_6px_18px_rgba(124,108,240,0.5)]">
          C
        </div>
        <span aria-hidden className="mb-[18px] h-9 w-px shrink-0 bg-white/10" />

        {itensVisiveis.map((item) => (
          <DockItem key={item.href} item={item} ativo={pathname === item.href} mouseX={mouseX} />
        ))}
      </motion.nav>
    </div>
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
