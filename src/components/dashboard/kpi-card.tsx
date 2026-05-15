'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

type KpiCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  accent?: 'blue' | 'green' | 'red' | 'gold' | 'purple'
}

const accents = {
  blue: 'from-sky-500/20 to-sky-400/5 text-sky-400',
  green: 'from-emerald-500/20 to-emerald-400/5 text-emerald-400',
  red: 'from-red-500/20 to-red-400/5 text-red-400',
  gold: 'from-yellow-500/20 to-yellow-400/5 text-yellow-300',
  purple: 'from-violet-500/20 to-violet-400/5 text-violet-400',
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
}: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-[28px] border border-white/5 bg-[var(--card)] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {title}
          </p>
        </div>

        {Icon && (
          <div className={`rounded-2xl bg-gradient-to-br p-3 ${accents[accent]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-5xl font-black tracking-[-0.05em]">{value}</h3>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>
    </motion.div>
  )
}