'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

import { SectionTitle } from './section-title'
import { MarketingMetricCard } from './marketing-metric-card'
import { PROJECAO_METRICAS, METRICAS_PRINCIPAIS, ICONES_METRICA } from './constants'
import { calcularPercentual } from './utils'

type MedicoChave = 'rodolpho' | 'breno' | 'claudia'

type ProjecaoMetricas = {
  seguidores: number
  alcance: number
  engajamento: number
  taxaEngaj: number
  views: number
  interacoes: number
  posts: number
  reels: number
  carrosseis: number
  storiesSemana: number
}

type MesProjecao = {
  mes: string
  ordem: number
  meta: ProjecaoMetricas
  atual: Partial<ProjecaoMetricas> | null
}

type ProjecaoPorMedico = Record<MedicoChave, { nome: string; meses: MesProjecao[] }>

const ORDEM_MES: Record<string, number> = {
  Janeiro: 1,
  Fevereiro: 2,
  Março: 3,
  Abril: 4,
  Maio: 5,
  Junho: 6,
  Julho: 7,
  Agosto: 8,
  Setembro: 9,
  Outubro: 10,
  Novembro: 11,
  Dezembro: 12,
}

const NOME_MES: Record<number, string> = Object.fromEntries(
  Object.entries(ORDEM_MES).map(([nome, ordem]) => [ordem, nome])
)

// Métricas de contagem são somadas entre os médicos; taxas (ex.: Taxa Engaj.) são
// médias, já que somar percentuais não representa o combinado real.
const METRICAS_SOMAVEIS = new Set([
  'seguidores',
  'alcance',
  'engajamento',
  'views',
  'interacoes',
  'posts',
  'reels',
  'carrosseis',
  'storiesSemana',
])

function parseLocalDate(dateString?: string) {
  if (!dateString) return null

  const [ano, mes, dia] = dateString.split('-').map(Number)
  if (!ano || !mes || !dia) return null

  return new Date(ano, mes - 1, dia)
}

function resolverOrdemMes(periodo: string, dataInicio?: string): number {
  if (periodo === 'personalizado') {
    const data = parseLocalDate(dataInicio)
    if (data) return data.getMonth() + 1
  }

  const hoje = new Date()

  if (periodo === 'mes-passado') {
    return ((hoje.getMonth() - 1 + 12) % 12) + 1
  }

  return hoje.getMonth() + 1
}

export function ProjecaoMedicosResumoCard({
  periodo,
  dataInicio,
}: {
  periodo: string
  dataInicio?: string
}) {
  const [projecao, setProjecao] = useState<ProjecaoPorMedico | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregarProjecao() {
      try {
        const res = await fetch('/api/projecao-medicos', { cache: 'no-store' })
        const json = await res.json()

        if (!ativo) return

        if (json.ok) {
          setProjecao(json.medicos)
          setErro(null)
        } else {
          setErro(json.error || 'Falha ao carregar projeção dos médicos')
        }
      } catch {
        // mantém o último valor carregado em caso de falha pontual
      }
    }

    carregarProjecao()

    const interval = setInterval(carregarProjecao, 30000)

    return () => {
      ativo = false
      clearInterval(interval)
    }
  }, [])

  const ordemAlvo = resolverOrdemMes(periodo, dataInicio)
  const nomeMes = NOME_MES[ordemAlvo] || ''

  if (!projecao) {
    return (
      <section className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] px-4 py-2 shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-[var(--accent)]/30">
        <div className="text-xs font-bold text-[var(--muted-foreground)]">
          {erro ? erro : 'Carregando projeção dos médicos...'}
        </div>
      </section>
    )
  }

  const medicos = Object.keys(projecao) as MedicoChave[]

  const mesesPorMedico = medicos
    .map((chave) => projecao[chave].meses.find((linha) => linha.ordem === ordemAlvo))
    .filter((linha): linha is MesProjecao => Boolean(linha))

  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] px-4 py-2 shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-[var(--accent)]/30">
      <SectionTitle
        icon={TrendingUp}
        title="Projeção dos médicos"
        subtitle={
          nomeMes
            ? `Meta x Atual — ${nomeMes} — todos os médicos juntos`
            : 'Meta x Atual — todos os médicos juntos'
        }
      />

      {mesesPorMedico.length === 0 ? (
        <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
          Sem dados de projeção para {nomeMes || 'o período selecionado'}
        </div>
      ) : (
        (() => {
          const metaSomada: Partial<ProjecaoMetricas> = {}
          const atualSomado: Partial<ProjecaoMetricas> = {}
          let algumAtualPreenchido = false

          PROJECAO_METRICAS.forEach(({ chave }) => {
            const somavel = METRICAS_SOMAVEIS.has(chave)

            const metaValores = mesesPorMedico
              .map((linha) => linha.meta?.[chave])
              .filter((v): v is number => typeof v === 'number')

            const atualValores = mesesPorMedico
              .map((linha) => linha.atual?.[chave])
              .filter((v): v is number => typeof v === 'number')

            if (metaValores.length > 0) {
              metaSomada[chave] = somavel
                ? metaValores.reduce((acc, v) => acc + v, 0)
                : metaValores.reduce((acc, v) => acc + v, 0) / metaValores.length
            }

            if (atualValores.length > 0) {
              algumAtualPreenchido = true
              atualSomado[chave] = somavel
                ? atualValores.reduce((acc, v) => acc + v, 0)
                : atualValores.reduce((acc, v) => acc + v, 0) / atualValores.length
            }
          })

          return (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {METRICAS_PRINCIPAIS.map(({ chave, cor }) => {
                  const metrica = PROJECAO_METRICAS.find((m) => m.chave === chave)!
                  const valorMeta = metaSomada[chave] ?? 0
                  const valorAtual = atualSomado[chave] ?? null
                  const percent = calcularPercentual(valorAtual, valorMeta)

                  return (
                    <MarketingMetricCard
                      key={chave}
                      label={metrica.label}
                      icon={ICONES_METRICA[chave]}
                      iconColor={cor}
                      valor={valorAtual !== null ? metrica.formatar(valorAtual) : 'Sem dados'}
                      meta={metrica.formatar(valorMeta)}
                      percent={percent}
                    />
                  )
                })}
              </div>

              {!algumAtualPreenchido && (
                <div className="mt-4 text-[11px] font-semibold text-[var(--muted-foreground)]">
                  Os valores de &quot;Atual&quot; ainda não estão preenchidos na planilha para {nomeMes}.
                </div>
              )}
            </>
          )
        })()
      )}
    </section>
  )
}
