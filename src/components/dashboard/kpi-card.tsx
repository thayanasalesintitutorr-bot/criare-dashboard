'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

type KpiCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  accent?: 'blue' | 'green' | 'red' | 'purple'
}

const accents = {
  blue: 'text-[var(--accent)]',
  green: 'text-[var(--success)]',
  red: 'text-[var(--danger)]',
  purple: 'text-violet-400',
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
      className="dashboard-section"
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="metric-label">{title}</p>
        </div>

        {Icon && (
          <div className={`rounded-[14px] bg-[var(--metric-card)] p-3 ${accents[accent]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="metric-value text-5xl">{value}</h3>
        {subtitle && <p className="metric-helper">{subtitle}</p>}
      </div>
    </motion.div>
  )
}