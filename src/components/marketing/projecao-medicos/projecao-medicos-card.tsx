'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

import { SectionTitle } from './section-title'
import { DoctorTabs } from './doctor-tabs'
import { PeriodTabs } from './period-tabs'
import { MarketingMetricCard } from './marketing-metric-card'
import { ProjectionLineChart } from './projection-line-chart'
import {
  PROJECAO_METRICAS,
  METRICAS_PRINCIPAIS,
  FILTROS_MES,
  ICONES_METRICA,
  FOTOS_MEDICO,
} from './constants'
import { calcularPercentual } from './utils'

type MedicoChave = 'rodolpho' | 'breno' | 'claudia'
type FiltroMes = 'atual' | 'anterior' | 'seguinte' | 'todos'

type MetricaCalculada = {
  valorMeta: number
  valorAtual: number | null
  percent: number | null
  metaFormatada: string
  atualFormatada: string
}

type MesProjecao = {
  mes: string
  ordem: number
  meta: Record<string, number>
  atual: Record<string, number> | null
}

function construirMetricas(linha: MesProjecao): Record<string, MetricaCalculada> {
  return Object.fromEntries(
    PROJECAO_METRICAS.map((metrica) => {
      const valorMeta = linha.meta[metrica.chave]
      const valorAtualBruto = linha.atual ? linha.atual[metrica.chave] : null
      const valorAtual = valorAtualBruto ?? null
      const percent = calcularPercentual(valorAtual, valorMeta)

      return [
        metrica.chave,
        {
          valorMeta,
          valorAtual,
          percent,
          metaFormatada: metrica.formatar(valorMeta),
          atualFormatada: valorAtual !== null ? metrica.formatar(valorAtual) : 'Sem dados',
        },
      ]
    })
  )
}

function construirSerieEvolucao(meses: MesProjecao[], chave: string) {
  return meses.map((linha) => ({
    mes: linha.mes as string,
    valor: linha.atual ? ((linha.atual[chave] ?? null) as number | null) : null,
  }))
}

const GRID_3 = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'

type ProjecaoPorMedico = Record<MedicoChave, { nome: string; meses: MesProjecao[] }>

export function ProjecaoMedicosCard() {
  const [projecao, setProjecao] = useState<ProjecaoPorMedico | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [medicoAtivo, setMedicoAtivo] = useState<MedicoChave>('rodolpho')
  const [filtroMes, setFiltroMes] = useState<FiltroMes>('atual')

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

  if (!projecao) {
    return (
      <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
        <div className="text-xs font-bold text-[var(--muted-foreground)]">
          {erro ? erro : 'Carregando projeção dos médicos...'}
        </div>
      </div>
    )
  }

  const medicos = Object.keys(projecao) as MedicoChave[]
  const medico = projecao[medicoAtivo]

  const hoje = new Date()
  const ordemAtual = hoje.getMonth() + 1
  const ordemAnterior = ((ordemAtual - 2 + 12) % 12) + 1
  const ordemSeguinte = (ordemAtual % 12) + 1

  const ordemAlvo =
    filtroMes === 'anterior'
      ? ordemAnterior
      : filtroMes === 'seguinte'
        ? ordemSeguinte
        : ordemAtual

  const mesesExibidos =
    filtroMes === 'todos'
      ? medico.meses
      : medico.meses.filter((linha: MesProjecao) => linha.ordem === ordemAlvo)

  return (
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-4 shadow-[var(--card-shadow)]">
      <SectionTitle
        icon={TrendingUp}
        title="Projeção dos médicos"
        subtitle="Meta x Atual por mês — redes sociais"
        right={
          <DoctorTabs
            medicos={medicos.map((chave) => ({
              chave,
              nome: projecao[chave].nome,
              foto: FOTOS_MEDICO[chave] ?? null,
            }))}
            ativo={medicoAtivo}
            onSelect={(chave) => setMedicoAtivo(chave as MedicoChave)}
          />
        }
      />

      <PeriodTabs
        opcoes={FILTROS_MES}
        ativo={filtroMes}
        onSelect={(chave) => setFiltroMes(chave as FiltroMes)}
      />

      {mesesExibidos.length === 0 ? (
        <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
          Sem dados de projeção para este mês
        </div>
      ) : filtroMes === 'todos' ? (
        <div className={GRID_3}>
          {METRICAS_PRINCIPAIS.map(({ chave, cor }) => {
            const metrica = PROJECAO_METRICAS.find((m) => m.chave === chave)!

            return (
              <ProjectionLineChart
                key={chave}
                label={metrica.label}
                icon={ICONES_METRICA[chave]}
                color={cor}
                dados={construirSerieEvolucao(medico.meses, chave)}
                formatar={metrica.formatar}
              />
            )
          })}
        </div>
      ) : (
        (() => {
          const metricas = construirMetricas(mesesExibidos[0])

          return (
            <div className={GRID_3}>
              {METRICAS_PRINCIPAIS.map(({ chave, cor }) => {
                const metrica = PROJECAO_METRICAS.find((m) => m.chave === chave)!

                return (
                  <MarketingMetricCard
                    key={chave}
                    label={metrica.label}
                    icon={ICONES_METRICA[chave]}
                    iconColor={cor}
                    valor={metricas[chave].atualFormatada}
                    meta={metricas[chave].metaFormatada}
                    percent={metricas[chave].percent}
                  />
                )
              })}
            </div>
          )
        })()
      )}

      <div className="mt-4 text-[11px] font-semibold text-[var(--muted-foreground)]">
        Os valores de &quot;Atual&quot; ainda não estão preenchidos na planilha OKRs_Mentoria_Ultra_Completo. Assim que forem lançados mês a mês, é só avisar para atualizar.
      </div>
    </div>
  )
}
