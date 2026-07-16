'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

import { SectionTitle } from './section-title'
import { MarketingMetricCard } from './marketing-metric-card'
import { PROJECAO_METRICAS, METRICAS_PRINCIPAIS, ICONES_METRICA, FOTOS_MEDICO } from './constants'
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

  const linhaPorMedico = medicos.map((chave) => ({
    chave,
    nome: projecao[chave].nome,
    foto: FOTOS_MEDICO[chave] ?? null,
    linha: projecao[chave].meses.find((m) => m.ordem === ordemAlvo) ?? null,
  }))

  const algumComDados = linhaPorMedico.some((item) => item.linha)

  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] px-4 py-2 shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-[var(--accent)]/30">
      <SectionTitle
        icon={TrendingUp}
        title="Projeção dos médicos"
        subtitle={nomeMes ? `Meta x Atual — ${nomeMes} — por médico` : 'Meta x Atual — por médico'}
      />

      {!algumComDados ? (
        <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
          Sem dados de projeção para {nomeMes || 'o período selecionado'}
        </div>
      ) : (
        <div className="space-y-4">
          {linhaPorMedico.map(({ chave, nome, foto, linha }, index) => (
            <div
              key={chave}
              className={index > 0 ? 'border-t border-[color:var(--border)] pt-4' : ''}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-[color:var(--border)] bg-[var(--metric-card)]">
                  {foto ? (
                    <img src={foto} alt={nome} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-[var(--foreground)]">
                      {nome.charAt(0)}
                    </span>
                  )}
                </span>

                <span className="text-[13px] font-black uppercase tracking-[0.06em] text-[var(--foreground)]">
                  {nome}
                </span>
              </div>

              {!linha ? (
                <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-xs font-semibold text-[var(--muted-foreground)]">
                  Sem dados de projeção para {nomeMes || 'o período selecionado'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {METRICAS_PRINCIPAIS.map(({ chave: metricaChave, cor }) => {
                    const metrica = PROJECAO_METRICAS.find((m) => m.chave === metricaChave)!
                    const valorMeta = linha.meta?.[metricaChave] ?? 0
                    const valorAtual = linha.atual?.[metricaChave] ?? null
                    const percent = calcularPercentual(valorAtual, valorMeta)

                    return (
                      <MarketingMetricCard
                        key={metricaChave}
                        label={metrica.label}
                        icon={ICONES_METRICA[metricaChave]}
                        iconColor={cor}
                        valor={valorAtual !== null ? metrica.formatar(valorAtual) : 'Sem dados'}
                        meta={metrica.formatar(valorMeta)}
                        percent={percent}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {!linhaPorMedico.some((item) => item.linha?.atual) && (
            <div className="text-[11px] font-semibold text-[var(--muted-foreground)]">
              Os valores de &quot;Atual&quot; ainda não estão preenchidos na planilha para {nomeMes}.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
