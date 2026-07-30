'use client'

import { motion } from 'framer-motion'

type ProgressBarProps = {
  percent: number | null
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const largura = percent === null ? 0 : Math.min(Math.max(percent, 0), 100)
  const cor =
    percent === null
      ? 'bg-[var(--border)]'
      : percent >= 100
        ? 'bg-[var(--success)]'
        : 'bg-[var(--danger)]'

  return (
    <div className="h-[3.5px] w-full overflow-hidden rounded-full bg-[var(--progress-bg)]">
      <motion.div
        className={`h-full w-full origin-left rounded-full ${cor}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: largura / 100 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
