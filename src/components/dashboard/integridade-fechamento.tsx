'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Eraser, Lock, RotateCcw, ShieldCheck } from 'lucide-react'
import { useSessionRole } from '@/store/use-session-role'

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

type Fechamento = { valorTotal: number; qtdVendas: number }
type Correcao = { leadId: number; nome: string; motivo: 'reembolso' | 'apagado'; valor: number; nota?: string | null }
type Resposta = {
  ok: boolean
  aoVivo?: Fechamento
  congelado?: (Fechamento & { congeladoEm: string }) | null
  correcoes?: Correcao[]
  error?: string
}

const MOTIVO_ESTILO: Record<Correcao['motivo'], { label: string; Icone: typeof RotateCcw; cor: string }> = {
  reembolso: { label: 'Reembolso', Icone: RotateCcw, cor: 'var(--warning)' },
  apagado: { label: 'Apagado', Icone: Eraser, cor: 'var(--muted-foreground)' },
}

function ListaCorrecoes({ correcoes }: { correcoes: Correcao[] }) {
  if (correcoes.length === 0) return null

  return (
    <div className="mt-2 space-y-1.5">
      {correcoes.map((c) => {
        const estilo = MOTIVO_ESTILO[c.motivo]
        return (
          <div
            key={c.leadId}
            className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 text-[12px]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <estilo.Icone size={13} className="shrink-0" style={{ color: estilo.cor }} />
              <span className="truncate font-semibold text-[var(--foreground)]" title={c.nota || undefined}>
                {c.nome}
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase"
                style={{ color: estilo.cor, backgroundColor: `color-mix(in srgb, ${estilo.cor} 18%, transparent)` }}
              >
                {estilo.label}
              </span>
            </div>
            <span className="shrink-0 font-bold text-[var(--muted-foreground)]">{brl(c.valor)}</span>
          </div>
        )
      })}
    </div>
  )
}

// Compara o faturamento consolidado "ao vivo" (recalculado agora, a partir
// do estado atual dos leads no Supabase) com o valor congelado manualmente
// no fechamento do mês. Como o Kommo permite reabrir/alterar um lead já
// fechado (ex: virar "Venda perdida" e apagar o valor depois do fato), o
// total ao vivo de um mês passado pode silenciosamente divergir do que foi
// fechado — isso avisa quando acontece.
export function IntegridadeFechamento({ mes }: { mes: string | null }) {
  const { role, fetchRole } = useSessionRole()
  const [dados, setDados] = useState<Resposta | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [congelando, setCongelando] = useState(false)

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  useEffect(() => {
    if (!mes) return

    let ativo = true

    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/fechamento-mensal?mes=${mes}`, { cache: 'no-store' })
        const json = await res.json()
        if (ativo) setDados(json)
      } catch {
        // mantém o último valor em caso de falha pontual
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [mes])

  async function congelar() {
    if (!mes) return
    setCongelando(true)
    try {
      const res = await fetch('/api/fechamento-mensal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes }),
      })
      const json = await res.json()
      if (json.ok) {
        const refetch = await fetch(`/api/fechamento-mensal?mes=${mes}`, { cache: 'no-store' })
        setDados(await refetch.json())
      }
    } finally {
      setCongelando(false)
    }
  }

  if (!mes || !dados?.ok || !dados.aoVivo) return null

  const { aoVivo, congelado } = dados
  const correcoes = dados.correcoes || []
  const nomeMes = new Date(`${mes}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (!congelado) {
    return (
      <div
        className={`mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 transition-opacity ${carregando ? 'opacity-60' : ''}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] font-semibold text-[var(--muted-foreground)]">
            Fechamento de {nomeMes} ainda não foi congelado — sem baseline pra detectar se algum lead mudar depois.
          </p>
          {role === 'admin' && (
            <button
              type="button"
              onClick={congelar}
              disabled={congelando}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
            >
              <Lock size={13} />
              {congelando ? 'Congelando...' : 'Congelar agora'}
            </button>
          )}
        </div>
        <ListaCorrecoes correcoes={correcoes} />
      </div>
    )
  }

  const diferenca = aoVivo.valorTotal - congelado.valorTotal
  const confere = Math.abs(diferenca) < 1

  if (confere) {
    return (
      <div className="mt-3 rounded-2xl bg-[var(--success)]/10 px-4 py-2.5 text-[var(--success)]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="shrink-0" />
          <p className="text-[12.5px] font-semibold">
            Fechamento de {nomeMes} confere com o congelado em {formatarDataHora(congelado.congeladoEm)} — {brl(congelado.valorTotal)}.
          </p>
        </div>
        <ListaCorrecoes correcoes={correcoes} />
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-2xl bg-[var(--danger)]/12 px-4 py-3 text-[var(--danger)]">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-snug">
            {nomeMes} diverge do fechamento congelado: {brl(aoVivo.valorTotal)} ao vivo vs. {brl(congelado.valorTotal)} congelado em{' '}
            {formatarDataHora(congelado.congeladoEm)} — diferença de {brl(Math.abs(diferenca))}.
          </p>
          <p className="mt-1 text-[12px] font-semibold text-[var(--muted-foreground)]">
            Algum lead fechado nesse mês provavelmente mudou de status ou teve o valor alterado depois. Confira no Kommo os leads
            desse período.
          </p>
          <ListaCorrecoes correcoes={correcoes} />
        </div>
        {role === 'admin' && (
          <button
            type="button"
            onClick={congelar}
            disabled={congelando}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--danger)]/40 px-3 py-1.5 text-[12px] font-bold disabled:opacity-60"
          >
            <Lock size={13} />
            {congelando ? '...' : 'Recongelar'}
          </button>
        )}
      </div>
    </div>
  )
}
