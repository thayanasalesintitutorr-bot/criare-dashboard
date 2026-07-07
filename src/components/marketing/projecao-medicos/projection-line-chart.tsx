'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LucideIcon } from 'lucide-react'

type PontoEvolucao = {
  mes: string
  valor: number | null
}

type ProjectionLineChartProps = {
  label: string
  icon: LucideIcon
  color: string
  dados: PontoEvolucao[]
  formatar: (valor: number) => string
}

function calcularTendencia(dados: PontoEvolucao[]): 'subindo' | 'descendo' | 'estavel' | null {
  const validos = dados.filter((ponto) => ponto.valor !== null) as { mes: string; valor: number }[]
  if (validos.length < 2) return null

  const primeiro = validos[0].valor
  const ultimo = validos[validos.length - 1].valor

  if (ultimo > primeiro) return 'subindo'
  if (ultimo < primeiro) return 'descendo'
  return 'estavel'
}

export function ProjectionLineChart({ label, icon: Icon, color, dados, formatar }: ProjectionLineChartProps) {
  const pontosValidos = dados.filter((ponto) => ponto.valor !== null)
  const tendencia = calcularTendencia(dados)

  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-[color:var(--border)] bg-[var(--metric-card)] p-3 shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[var(--card)]"
            style={{ color }}
          >
            <Icon size={14} strokeWidth={2.4} />
          </div>
          <span className="metric-label">{label}</span>
        </div>

        {tendencia && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
              tendencia === 'subindo'
                ? 'bg-[var(--success)]/10 text-[var(--success)]'
                : tendencia === 'descendo'
                  ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)]'
            }`}
          >
            <span>{tendencia === 'subindo' ? '▲' : tendencia === 'descendo' ? '▼' : '●'}</span>
            {tendencia === 'subindo' ? 'Subindo' : tendencia === 'descendo' ? 'Descendo' : 'Estável'}
          </span>
        )}
      </div>

      {pontosValidos.length < 2 ? (
        <div className="flex h-[90px] items-center justify-center px-2 text-center text-[11px] font-semibold text-[var(--muted-foreground)]">
          Sem histórico suficiente para projeção
        </div>
      ) : (
        <div className="h-[90px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 9, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(valor: string) => valor.slice(0, 3)}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--foreground)',
                }}
                formatter={(valor) => [formatar(Number(valor)), label]}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
