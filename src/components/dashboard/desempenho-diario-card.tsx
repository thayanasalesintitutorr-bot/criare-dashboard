'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  BarChart3,
  ChartNoAxesCombined,
  CircleDollarSign,
  Handshake,
  LineChart as LineChartIcon,
  Stethoscope,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

function diaDaSemana(data: string) {
  return DIAS_SEMANA[new Date(`${data}T00:00:00`).getDay()]
}

export type DiaDesempenho = {
  data: string
  label: string
  atendimentos: number
  faturamento: number
  vendas: number
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function brlCurto(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1000).toFixed(v >= 10_000 ? 0 : 1).replace('.', ',')} mil`
  return brl(v)
}

type Serie = {
  chave: 'atendimentos' | 'faturamento' | 'vendas'
  titulo: string
  legenda: string
  Icone: LucideIcon
  cor: string
  dinheiro: boolean
}

const SERIES: Serie[] = [
  { chave: 'atendimentos', titulo: 'Atendimento por dia', legenda: 'consultas atendidas', Icone: Stethoscope, cor: 'var(--accent)', dinheiro: false },
  { chave: 'faturamento', titulo: 'Consulta', legenda: 'faturamento de consultas', Icone: CircleDollarSign, cor: 'var(--success)', dinheiro: true },
  { chave: 'vendas', titulo: 'Procedimentos', legenda: 'valor vendido', Icone: Handshake, cor: '#A855F7', dinheiro: true },
]

// Um único card com os 3 indicadores diários (atendimentos, faturamento de
// consultas e vendas) empilhados no mesmo eixo de dias, pra comparar o ritmo
// de um com o outro dia a dia. Aparece nos filtros semanal/mensal.
export function DesempenhoDiarioCard({ dias }: { dias: DiaDesempenho[] }) {
  const dados = useMemo(
    () =>
      dias.map((d) => {
        const dow = new Date(`${d.data}T00:00:00`).getDay()
        return { ...d, fimDeSemana: dow === 0 || dow === 6 }
      }),
    [dias],
  )

  const mostrarRotulos = dados.length <= 10
  const [tipoGrafico, setTipoGrafico] = useState<'barra' | 'linha'>('barra')

  return (
    <section className="fx-card rounded-[24px] border border-[color:var(--border)] bg-[var(--card)]/60 p-4 shadow-[var(--card-shadow)] backdrop-blur-xl backdrop-saturate-150 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ChartNoAxesCombined className="h-6 w-6 text-[var(--accent)]" />
          <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[var(--foreground)]">Desempenho dia a dia</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-[12px] font-bold text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--foreground)]" /> Seg a sex
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--muted-foreground)]/40" /> Sáb e dom
            </span>
          </div>
          <div className="flex items-center gap-0.5 rounded-full border border-[color:var(--border)] bg-[var(--metric-card)]/55 p-0.5">
            <button
              type="button"
              onClick={() => setTipoGrafico('barra')}
              title="Gráfico de barras"
              className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
                tipoGrafico === 'barra' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted-foreground)]'
              }`}
            >
              <BarChart3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setTipoGrafico('linha')}
              title="Gráfico de linha"
              className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
                tipoGrafico === 'linha' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted-foreground)]'
              }`}
            >
              <LineChartIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SERIES.map((s) => {
          const total = dados.reduce((a, d) => a + d[s.chave], 0)
          const diasComValor = dados.filter((d) => d[s.chave] > 0)
          const melhor = diasComValor.reduce<DiaDesempenho & { fimDeSemana: boolean } | null>(
            (m, d) => (!m || d[s.chave] > m[s.chave] ? d : m),
            null
          )
          const pior = diasComValor.reduce<DiaDesempenho & { fimDeSemana: boolean } | null>(
            (m, d) => (!m || d[s.chave] < m[s.chave] ? d : m),
            null
          )
          const mostrarPior = pior && melhor && pior.data !== melhor.data
          const fmt = (v: number) => (s.dinheiro ? brlCurto(v) : String(v))

          return (
            <div
              key={s.chave}
              className="grid items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[var(--metric-card)]/55 p-3 @3xl:grid-cols-[220px_1fr]"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14px] font-bold text-[var(--foreground)]">
                  <s.Icone size={17} style={{ color: s.cor }} />
                  {s.titulo}
                </p>
                <p className="mt-1 whitespace-nowrap text-[30px] font-black leading-none tracking-tight" style={{ color: s.cor }}>
                  {fmt(total)}
                </p>
                <p className="mt-1 text-[12.5px] font-semibold text-[var(--muted-foreground)]">{s.legenda} no período</p>
                {melhor && melhor[s.chave] > 0 && (
                  <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--muted-foreground)]">
                    melhor dia: <span className="text-[var(--foreground)]">{melhor.label} ({diaDaSemana(melhor.data)})</span> ·{' '}
                    {fmt(melhor[s.chave])}
                  </p>
                )}
                {mostrarPior && pior && (
                  <p className="mt-0.5 text-[12.5px] font-semibold text-[var(--muted-foreground)]">
                    pior dia: <span className="text-[var(--foreground)]">{pior.label} ({diaDaSemana(pior.data)})</span> ·{' '}
                    {fmt(pior[s.chave])}
                  </p>
                )}
              </div>

              <div className="h-[150px] min-w-0">
                {dados.some((d) => d[s.chave] > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {tipoGrafico === 'barra' ? (
                      <BarChart data={dados} margin={{ top: 16, right: 6, left: 6, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                          axisLine={false}
                          tickLine={false}
                          interval={dados.length > 16 ? 1 : 0}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--progress-bg)' }}
                          contentStyle={{
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--foreground)',
                          }}
                          formatter={(value) => [s.dinheiro ? brl(Number(value || 0)) : value, s.titulo]}
                        />
                        <Bar
                          dataKey={s.chave}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={24}
                          isAnimationActive={false}
                          label={
                            mostrarRotulos
                              ? {
                                  position: 'top',
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  fill: 'var(--foreground)',
                                  formatter: (v: unknown) => (Number(v) > 0 ? fmt(Number(v)) : ''),
                                }
                              : false
                          }
                        >
                          {dados.map((d, i) => (
                            <Cell key={d.data || i} fill={s.cor} fillOpacity={d.fimDeSemana ? 0.3 : 1} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart data={dados} margin={{ top: 16, right: 6, left: 6, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                          axisLine={false}
                          tickLine={false}
                          interval={dados.length > 16 ? 1 : 0}
                        />
                        <Tooltip
                          cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                          contentStyle={{
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--foreground)',
                          }}
                          formatter={(value) => [s.dinheiro ? brl(Number(value || 0)) : value, s.titulo]}
                        />
                        <Line
                          dataKey={s.chave}
                          stroke={s.cor}
                          strokeWidth={2.5}
                          isAnimationActive={false}
                          dot={(props: { cx?: number; cy?: number; payload?: { fimDeSemana: boolean }; index?: number }) => {
                            const { cx, cy, payload, index } = props
                            if (cx == null || cy == null) return <g key={`dot-${index}`} />
                            return (
                              <circle
                                key={`dot-${index}`}
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill={s.cor}
                                fillOpacity={payload?.fimDeSemana ? 0.3 : 1}
                                stroke="none"
                              />
                            )
                          }}
                          activeDot={{ r: 5.5 }}
                          label={
                            mostrarRotulos
                              ? {
                                  position: 'top',
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  fill: 'var(--foreground)',
                                  formatter: (v: unknown) => (Number(v) > 0 ? fmt(Number(v)) : ''),
                                }
                              : false
                          }
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] font-semibold text-[var(--muted-foreground)]">
                    Sem dados no período
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
