'use client'

type BadgeStatusProps = {
  percent: number | null
}

export function BadgeStatus({ percent }: BadgeStatusProps) {
  if (percent === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--card)] px-1.5 py-0.5 text-[10px] font-black text-[var(--muted-foreground)]">
        <span className="text-[var(--muted-foreground)]">●</span>
        Sem dados
      </span>
    )
  }

  const acimaDaMeta = percent >= 100
  const diferenca = Math.round(Math.abs(percent - 100))

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
        acimaDaMeta
          ? 'bg-[var(--success)]/10 text-[var(--success)]'
          : 'bg-[var(--danger)]/10 text-[var(--danger)]'
      }`}
    >
      <span>{acimaDaMeta ? '▲' : '▼'}</span>
      {diferenca}%
    </span>
  )
}
