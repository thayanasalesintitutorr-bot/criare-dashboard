'use client'

type PeriodTabsProps = {
  opcoes: readonly (readonly [string, string])[]
  ativo: string
  onSelect: (chave: string) => void
}

export function PeriodTabs({ opcoes, ativo, onSelect }: PeriodTabsProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {opcoes.map(([chave, label]) => (
        <button
          key={chave}
          type="button"
          onClick={() => onSelect(chave)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-[0.04em] transition-colors ${
            ativo === chave
              ? 'border-[color:var(--accent)] bg-[var(--metric-card)] text-[var(--accent)]'
              : 'border-[color:var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
