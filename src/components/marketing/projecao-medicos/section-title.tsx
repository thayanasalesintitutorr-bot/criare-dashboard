'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type SectionTitleProps = {
  title: string
  subtitle?: string
  icon?: LucideIcon
  right?: ReactNode
  size?: 'lg' | 'sm'
}

export function SectionTitle({ title, subtitle, icon: Icon, right, size = 'lg' }: SectionTitleProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${size === 'lg' ? 'mb-3' : 'mb-2'}`}>
      <div>
        <div
          className={`flex items-center gap-2 font-black uppercase leading-[1.12] tracking-[0.08em] text-[var(--foreground)] ${
            size === 'lg' ? 'text-[16px]' : 'text-[12px] text-[var(--muted-foreground)]'
          }`}
        >
          {Icon && <Icon size={size === 'lg' ? 18 : 14} className="text-[var(--accent)]" />}
          {title}
        </div>

        {subtitle && (
          <div className="mt-0.5 text-xs font-bold text-[var(--muted-foreground)]">{subtitle}</div>
        )}
      </div>

      {right}
    </div>
  )
}
