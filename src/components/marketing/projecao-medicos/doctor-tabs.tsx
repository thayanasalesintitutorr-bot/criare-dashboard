'use client'

type Medico = {
  chave: string
  nome: string
  foto: string | null
}

type DoctorTabsProps = {
  medicos: Medico[]
  ativo: string
  onSelect: (chave: string) => void
}

export function DoctorTabs({ medicos, ativo, onSelect }: DoctorTabsProps) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-[color:var(--border)]">
      {medicos.map((medico) => (
        <button
          key={medico.chave}
          type="button"
          onClick={() => onSelect(medico.chave)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-[0.04em] transition-colors ${
            ativo === medico.chave
              ? 'bg-[var(--accent)] text-[var(--background)]'
              : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
          }`}
        >
          <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-[color:var(--border)] bg-[var(--metric-card)]">
            {medico.foto ? (
              <img src={medico.foto} alt={medico.nome} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[9px] font-black text-[var(--foreground)]">
                {medico.nome.charAt(0)}
              </span>
            )}
          </span>
          {medico.nome}
        </button>
      ))}
    </div>
  )
}
