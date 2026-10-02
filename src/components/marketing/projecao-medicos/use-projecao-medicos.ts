'use client'

import { useEffect, useMemo, useState } from 'react'

import { PROJECAO_METRICAS, METRICAS_PRINCIPAIS } from './constants'
import { calcularPercentual } from './utils'
import {
  NOME_MES,
  resolverOrdemMes,
  type Kpi,
  type MedicoChave,
  type ProjecaoPorMedico,
} from './projecao-medicos-resumo-card'

export type ProjecaoDoMedico = {
  kpis: Kpi[]
  nomeMes: string
}

// Só os médicos que têm linha de projeção no mês escolhido entram no mapa —
// quem não tem dado simplesmente não aparece (é o que o card unificado usa
// pra decidir se mostra o bloco de projeção).
export function useProjecaoMedicos(periodo: string, dataInicio?: string) {
  const [projecao, setProjecao] = useState<ProjecaoPorMedico | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const res = await fetch('/api/projecao-medicos', { cache: 'no-store' })
        const json = await res.json()
        if (ativo && json.ok) setProjecao(json.medicos)
      } catch {
        // mantém o último valor carregado em caso de falha pontual
      }
    }

    carregar()
    const intervalo = setInterval(carregar, 60000)

    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [])

  const ordemAlvo = resolverOrdemMes(periodo, dataInicio)

  return useMemo(() => {
    const mapa: Partial<Record<MedicoChave, ProjecaoDoMedico>> = {}
    if (!projecao) return mapa

    for (const chave of Object.keys(projecao) as MedicoChave[]) {
      const linha = projecao[chave].meses.find((m) => m.ordem === ordemAlvo)
      if (!linha) continue

      const kpis: Kpi[] = METRICAS_PRINCIPAIS.map(({ chave: metricaChave }) => {
        const metrica = PROJECAO_METRICAS.find((m) => m.chave === metricaChave)!
        const meta = linha.meta?.[metricaChave] ?? 0
        const atual = linha.atual?.[metricaChave] ?? null
        return {
          chave: metricaChave,
          label: metrica.label,
          meta,
          atual,
          percent: calcularPercentual(atual, meta),
        }
      })

      mapa[chave] = { kpis, nomeMes: NOME_MES[ordemAlvo] || '' }
    }

    return mapa
  }, [projecao, ordemAlvo])
}
