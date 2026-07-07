'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { BadgeStatus } from './badge-status'
import { ProgressBar } from './progress-bar'

type MarketingMetricCardProps = {
  label: string
  icon: LucideIcon
  iconColor?: string
  valor: string
  meta: string
  percent: number | null
}

export function MarketingMetricCard({
  label,
  icon: Icon,
  iconColor = 'var(--accent)',
  valor,
  meta,
  percent,
}: MarketingMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-2 rounded-[14px] border border-[color:var(--border)] bg-[var(--metric-card)] p-3 shadow-[var(--card-shadow)]"
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--card)]"
          style={{ color: iconColor }}
        >
          <Icon size={14} strokeWidth={2.4} />
        </div>

        <span className="metric-label">{label}</span>
      </div>

      <div className="metric-value text-2xl leading-none">{valor}</div>

      <div className="flex items-center gap-2">
        <ProgressBar percent={percent} />
        <span className="shrink-0 text-[10px] font-bold text-[var(--muted-foreground)]">
          Meta {meta}
        </span>
      </div>

      <div>
        <BadgeStatus percent={percent} />
      </div>
    </motion.div>
  )
}
