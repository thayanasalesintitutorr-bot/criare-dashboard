'use client'

import { useEffect, useState } from 'react'
import { MessageCircleWarning } from 'lucide-react'
import { useFilters } from '@/store/use-filters'

export type PrimeiraMensagemData = {
  total: number
  porCampanha: { campanha: string; qtd: number }[]
}

function useHoverCapaz() {
  const [hoverCapaz, setHoverCapaz] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const atualizar = (event: MediaQueryListEvent) => setHoverCapaz(event.matches)
    media.addEventListener('change', atualizar)
    return () => media.removeEventListener('change', atualizar)
  }, [])

  return hoverCapaz
}

export function usePrimeiraMensagem(periodo: string, dataInicio?: string, dataFim?: string) {
  const [dados, setDados] = useState<PrimeiraMensagemData | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        let url = `/api/primeira-mensagem?periodo=${periodo}`
        if (periodo === 'personalizado' && dataInicio && dataFim) {
          url += `&inicio=${dataInicio}&fim=${dataFim}`
        }

        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json()

        if (!ativo) return
        if (json.ok) setDados({ total: json.total, porCampanha: json.porCampanha })
      } catch {
        // mantém o último valor carregado em caso de falha pontual
      }
    }

    carregar()
    const interval = setInterval(carregar, 60000)

    return () => {
      ativo = false
      clearInterval(interval)
    }
  }, [periodo, dataInicio, dataFim])

  return dados
}

export function PrimeiraMensagemTile({
  periodo,
  dataInicio,
  dataFim,
}: {
  periodo: string
  dataInicio?: string
  dataFim?: string
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'
  const isIphone = viewMode === 'iphone'
  const hoverCapaz = useHoverCapaz()

  const dados = usePrimeiraMensagem(periodo, dataInicio, dataFim)
  const [aberto, setAberto] = useState(false)

  return (
    <div
      className="relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-[color:var(--warning)]/40 bg-[var(--warning)]/10 py-1.5"
      onMouseEnter={hoverCapaz ? () => setAberto(true) : undefined}
      onMouseLeave={hoverCapaz ? () => setAberto(false) : undefined}
      onClick={!hoverCapaz ? () => setAberto((atual) => !atual) : undefined}
    >
      <span
        className={`flex items-center gap-1 font-bold uppercase tracking-wide text-[var(--warning)] ${
          isApresentacao ? 'text-[14px]' : 'text-[9px]'
        }`}
      >
        <MessageCircleWarning size={isApresentacao ? 16 : 10} className="shrink-0" />
        1ª msg
      </span>

      <span
        className={`font-bold text-[var(--warning)] ${
          isApresentacao ? 'text-[28px]' : isIphone ? 'text-[15px]' : 'text-[14px]'
        }`}
      >
        {dados?.total ?? '—'}
      </span>

      {aberto && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-[280px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 rounded-[16px] border border-[color:var(--border)] bg-[var(--card)] p-3 text-left shadow-[var(--card-shadow)]">
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Leads que só mandaram 1 mensagem
          </div>

          {!dados || dados.porCampanha.length === 0 ? (
            <div className="text-[13px] font-semibold text-[var(--muted-foreground)]">Sem dados no período</div>
          ) : (
            <div className="space-y-1.5">
              {dados.porCampanha.map((item) => (
                <div key={item.campanha} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[12px] font-medium text-[var(--foreground)]">
                    {item.campanha}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold text-[var(--foreground)]">{item.qtd}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
