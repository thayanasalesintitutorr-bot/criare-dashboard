'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import {
  CircleDollarSign,
  TrendingUp,
  Target,
  Megaphone,
  Stethoscope,
  CalendarDays,
  UserX,
  UserCheck,
  DollarSign,
  Ticket,
  Handshake,
  ClipboardList,
} from 'lucide-react'

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

type DashboardResponse = {
  ok: boolean
  consultaPorMedico?: {
  medico: string
  atendimentos: number
  noShow: number
  noShowPercent: number
  quantidadeConsulta: number
  valorConsulta: number
  ticketMedio: number
}[]
  error?: string
  kpis?: {
    comercialConsulta: {
      quantidadeConsulta: number
      valorTotalConsulta: number
      ticketMedioConsulta: number
    }
  }
  campanhasConsulta?: {
    nome: string
    qtd: number
    valor: number
    percentual: number
  }[]

  atendimentoConsulta?: {
  nome: string
  qtd: number
  valor: number
}[]

conveniosConsulta?: {
  nome: string
  qtd: number
  valor: number
}[]

}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

const COLORS = [
  '#6366F1',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#A855F7',
]

const fotosMedicos: Record<string, string> = {
  'DR. RODOLPHO REIS': '/medicos/rodolpho.png',
  'DRA. CLAUDIA LAMEIRA': '/medicos/claudia.png',
  'DR. BRENO PITANGUI': '/medicos/breno.png',
}

function getFotoMedico(nome: string) {
  const n = nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()

  if (n.includes('RODOLPHO')) return '/medicos/rodolpho.png'
  if (n.includes('CLAUDIA')) return '/medicos/claudia.png'
  if (n.includes('BRENO')) return '/medicos/breno.png'

  return null
}

export default function FunilPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDark, setIsDark] = useState(false)

useEffect(() => {
  const updateTheme = () => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }

  updateTheme()

  const observer = new MutationObserver(updateTheme)

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  return () => observer.disconnect()
}, [])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`

        if (periodo === 'personalizado' && dataInicio && dataFim) {
          url += `&inicio=${dataInicio}&fim=${dataFim}`
        }

        const res = await fetch(url, { cache: 'no-store' })
        const json: DashboardResponse = await res.json()

        if (!json.ok) throw new Error(json.error || 'Erro ao buscar dados')

        setData(json)
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [periodo, tipoData, segmento, dataInicio, dataFim])

  const consulta = data?.kpis?.comercialConsulta
  const campanhasConsulta = data?.campanhasConsulta || []
  const consultaPorMedico = data?.consultaPorMedico || []
  const atendimentoConsulta = data?.atendimentoConsulta || []
  const conveniosConsulta = data?.conveniosConsulta || []

  if (loading) {
    return (
      <AppShell title="Consulta (Funil)">
        <div className="rounded-[28px] bg-[var(--card)] p-6 dark:bg-[#0E243B]">
          Carregando consultas...
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Consulta (Funil)">
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Consulta (Funil)">
      <div className="space-y-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CardMini
            icon={Target}
            title="Agendados"
            value={(data as any)?.kpis?.marketing?.agendados ?? 0}
            big
          />

          <CardMini
            icon={TrendingUp}
            title="Consultas"
            value={consulta?.quantidadeConsulta || 0}
            subtitle="consulta ganha"
          />

          <CardMini
            icon={CircleDollarSign}
            title="Valor de Consulta"
            value={formatMoney(consulta?.valorTotalConsulta || 0)}
          />

          <CardMini
            icon={CircleDollarSign}
            title="Ticket médio"
            value={formatMoney(consulta?.ticketMedioConsulta || 0)}
            subtitle="por consulta"
          />
        </div>

       <section className="rounded-[30px] border border-white/10 bg-[var(--card)] p-6 text-[var(--foreground)] shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:bg-[#0E243B]">
  <div className="mb-6 flex items-center gap-3">
    <Stethoscope className="h-6 w-6 text-[var(--accent)]" />
    <h2 className="text-[26px] font-black">Consultas por médico</h2>
  </div>

  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    {consultaPorMedico.map((medico: any) => (
      <div
        key={medico.medico}
        className="rounded-[28px] border border-white/10 bg-[var(--background)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#D7B46A]/40 bg-[#D7B46A]/10">
  {getFotoMedico(medico.medico) ? (
  <img
    src={getFotoMedico(medico.medico) || ''}
    alt=""
    className="block h-full w-full object-cover"
  />
) : (
    <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#D7B46A]">
      DR
    </div>
  )}
</div>

            <h3 className="text-xl font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
              {medico.medico}
            </h3>
          </div>

        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <MetricCard
            icon={CalendarDays}
            label="Atendimentos"
            value={medico.atendimentos}
            description="Total de atendimentos"
            tone="blue"
          />

          <MetricCard
            icon={medico.noShowPercent <= 10 ? UserCheck : UserX}
            label="No Show"
            value={`${medico.noShow} (${medico.noShowPercent}%)`}
            description={medico.noShowPercent <= 10 ? 'Dentro da meta' : 'Acima da meta'}
            tone={medico.noShowPercent <= 10 ? 'green' : 'red'}
          />
        </div>



        <div
  className="mt-4 rounded-[24px] border p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
  style={{
    background: document.documentElement.classList.contains('dark')
      ? '#0B3328'
      : '#ECFDF3',
    borderColor: document.documentElement.classList.contains('dark')
      ? 'transparent'
      : '#D1FAE5',
  }}
>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <TrendingUp className="h-7 w-7" />
              </div>

              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  Consultas ganhas
                </p>

                <p className="mt-1 text-4xl font-black text-emerald-500">
                  {medico.quantidadeConsulta}
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)] dark:text-slate-300">
                  Conversões realizadas
                </p>
              </div>
            </div>

            <MiniTrend data={medico.evolucaoConsulta || []} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <MetricCard
            icon={DollarSign}
            label="Valor consulta"
            value={formatMoney(medico.valorConsulta)}
            description="Faturamento total"
            tone="blue"
          />

          <MetricCard
            icon={Ticket}
            label="Ticket médio"
            value={formatMoney(medico.ticketMedio)}
            description="Média por consulta"
            tone="purple"
          />
        </div>

        
      </div>
    ))}
  </div>
</section>

<section className="grid gap-6 xl:grid-cols-2">
  <div className="rounded-[30px] border border-white/5 bg-[var(--card)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:bg-[#0E243B]">
   <div className="mb-6 flex items-center gap-3">
  <ClipboardList className="h-7 w-7 text-[#E8C98A]" />

  <h2 className="text-[24px] font-black">
    Tipo de atendimento
  </h2>
</div>

    <div className="h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={atendimentoConsulta}
        dataKey="qtd"
        nameKey="nome"
        innerRadius={0}
        outerRadius={125}
        paddingAngle={0}
        stroke="transparent"
        labelLine={false}
        label={({ cx, cy, midAngle, outerRadius, name, value, index }: any) => {
          const RADIAN = Math.PI / 180
          const radius = outerRadius + 20
          const x = cx + radius * Math.cos(-midAngle * RADIAN)
          const y = cy + radius * Math.sin(-midAngle * RADIAN)

          return (
            <text
              x={x}
              y={y}
              textAnchor={x > cx ? 'start' : 'end'}
              dominantBaseline="central"
              className="text-[13px] font-bold"
            >
              <tspan fill={isDark ? '#F8FAFC' : '#0F172A'}>{name}: </tspan>
              <tspan fill={COLORS[index % COLORS.length]}>{value}</tspan>
            </text>
          )
        }}
      >
        {atendimentoConsulta.map((_, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
</div>

<div className="mt-12 flex items-center justify-center gap-10">
  {atendimentoConsulta.map((item, index) => (
    <div
      key={item.nome}
      className="flex items-center gap-3"
    >
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: COLORS[index % COLORS.length] }}
      />

      <p className={`text-3xl font-black ${
  isDark ? 'text-white' : 'text-slate-950'
}`}>
  {formatMoney(item.valor || 0)}
</p>
    </div>
  ))}
</div>
</div>

  <div className="rounded-[30px] border border-white/5 bg-[var(--card)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:bg-[#0E243B]">
    <div className="mb-6 flex items-center gap-3">
  <Handshake className="h-7 w-7 text-[#E8C98A]" />

  <h2 className="text-[24px] font-black">
    Convênios dos ganhos
  </h2>
</div>
    <div className="flex items-center justify-center">
  <div className="h-[420px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
      cx="50%"
  cy="50%"
        data={[
          ...conveniosConsulta.slice(0, 6),
          ...(conveniosConsulta.length > 6
            ? [
                {
                  nome: 'OUTROS',
                  qtd: conveniosConsulta
                    .slice(6)
                    .reduce((acc, item) => acc + item.qtd, 0),
                },
              ]
            : []),
        ]}
         dataKey="qtd"
  nameKey="nome"
  innerRadius={80}
  outerRadius={120}
  paddingAngle={3}
  stroke="transparent"
  labelLine={false}
        label={({ cx, cy, midAngle, outerRadius, name, value, index }: any) => {
          const RADIAN = Math.PI / 180
          const radius = outerRadius + 18
          const x = cx + radius * Math.cos(-midAngle * RADIAN)
          const y = cy + radius * Math.sin(-midAngle * RADIAN)

          const corNumero =
            name === 'OUTROS'
              ? '#9CA3AF'
              : COLORS[index % COLORS.length]

          return (
            <text
              x={x}
              y={y}
              textAnchor={x > cx ? 'start' : 'end'}
              dominantBaseline="central"
              className="text-[12px] font-bold"
            >
              <tspan fill={isDark ? '#F8FAFC' : '#0F172A'}>{name}: </tspan>
              <tspan fill={corNumero}>{value}</tspan>
            </text>
          )
        }}
      >
        {[
          ...conveniosConsulta.slice(0, 6),
          ...(conveniosConsulta.length > 6
            ? [
                {
                  nome: 'OUTROS',
                  qtd: conveniosConsulta
                    .slice(6)
                    .reduce((acc, item) => acc + item.qtd, 0),
                },
              ]
            : []),
        ].map((item, index) => (
          <Cell
            key={index}
            fill={item.nome === 'OUTROS' ? '#9CA3AF' : COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <text
  x="50%"
  y="50%"
  textAnchor="middle"
  dominantBaseline="middle"
  className="fill-[var(--foreground)] text-4xl font-black"
>
  {conveniosConsulta.reduce((acc, item) => acc + item.qtd, 0)}
</text>

<text
  x="50%"
  y="60%"
  textAnchor="middle"
  className="fill-[var(--muted-foreground)] text-sm"
>
  Total
</text>

    </PieChart>
  </ResponsiveContainer>

  
    </div>

</div>

  </div>
</section>

<section
  className={`rounded-[30px] border border-white/5 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)] ${
    isDark
  ? 'bg-[#0D2238] border-[#16324C]'
  : 'bg-[var(--card)]'
  }`}
>
  <div className="mb-6 flex items-center gap-3">
    <Megaphone className="h-6 w-6 text-[var(--accent)]" />
    <h2 className="text-[26px] font-black text-[var(--foreground)]">
      Consultas por campanha
    </h2>
  </div>

  <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
    
    <div className="flex items-start justify-center pt-2">

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
  data={campanhasConsulta}
  dataKey="valor"
  nameKey="nome"
  innerRadius={80}
  outerRadius={130}
  paddingAngle={2}
  stroke="transparent"
  labelLine={false}
  label={({ cx, cy, midAngle, innerRadius, outerRadius, index }: any) => {
  const RADIAN = Math.PI / 180
  const campanha = campanhasConsulta[index]
  const isSmall = campanha.qtd <= 4

  const radius = isSmall
    ? outerRadius + 24
    : innerRadius + (outerRadius - innerRadius) * 0.5

  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill={
  isDark
    ? 'white'
    : isSmall
      ? '#0F172A'
      : 'white'
}
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontSize: 16,
        fontWeight: 800,
      }}
    >
      {campanha.qtd}
    </text>
  )
}}

>
  {campanhasConsulta.map((_, index) => (
    <Cell
      key={`cell-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Pie>
          <text
  x="50%"
  y="50%"
  textAnchor="middle"
  dominantBaseline="middle"
  className="fill-[var(--foreground)] text-5xl font-black"
>
  {campanhasConsulta.reduce((acc, item) => acc + item.qtd, 0)}
</text>

<text
  x="50%"
  y="64%"
  textAnchor="middle"
  className="fill-[var(--muted-foreground)] text-sm"
>
  Total
</text>

        </PieChart>

    
      </ResponsiveContainer>
    </div>

    <div className="space-y-3">
      {campanhasConsulta.length === 0 && (
        <div className="rounded-2xl bg-[var(--muted)] p-5 text-sm text-[var(--muted-foreground)]">
          Nenhuma consulta com campanha no período.
        </div>
      )}

      {campanhasConsulta.map((campanha, index) => (
       <div
    key={campanha.nome}
  className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-all shadow-[0_10px_25px_rgba(15,23,42,0.06)] ${
  isDark
    ? 'border-[#1A3653] bg-[#102841] shadow-none'
    : 'border-transparent bg-[#EEF2FF]'
}`}
>
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />

            <div>
              <p className={`font-semibold ${
  isDark ? 'text-slate-100' : 'text-slate-950'
}`}>
  {campanha.nome}
</p>
              <p className={`text-sm ${
  isDark ? 'text-slate-400' : 'text-[var(--muted-foreground)]'
}`}>
                {campanha.qtd} consultas
              </p>
            </div>
          </div>

          <div className="text-right">
           <p className={`font-bold ${
  isDark ? 'text-slate-100' : 'text-slate-950'
}`}>
  {formatMoney(campanha.valor)}
</p>
            <p className={`text-sm ${
  isDark ? 'text-slate-400' : 'text-[var(--muted-foreground)]'
}`}>
  {Math.round(campanha.percentual)}%
</p>
          </div>
        </div>
      ))}
    </div>
  </div>
  </section>
      </div>
    </AppShell>
  )
}

function CardMini({
  icon: Icon,
  title,
  value,
  subtitle,
  statusClass,
}: any) {
  return (
    <div
      className={`rounded-[24px] border border-white/5 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)] ${
        statusClass || 'bg-[var(--card)] dark:bg-[#0E243B]'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className="text-[var(--accent)]" />

        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {title}
        </p>
      </div>

      <h3 className={`text-4xl font-black tracking-[-0.05em] ${statusClass ? 'dark:text-white' : ''}`}>
        {value}
      </h3>

      {subtitle && (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = 'blue',
}: {
  icon: any
  label: string
  value: string | number
  description: string
  tone?: 'blue' | 'green' | 'red' | 'purple'
}) {
  const tones = {
  blue:
    'border-blue-100 bg-blue-50 text-blue-600 shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:border-blue-500/20 dark:bg-[#0B1F35] dark:text-blue-400',

  green:
    'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:border-emerald-500/20 dark:bg-[#0B3328] dark:text-emerald-400',

  red:
    'border-red-100 bg-red-50 text-red-600 shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:border-red-500/20 dark:bg-[#3A1020] dark:text-red-400',

  purple:
    'border-purple-100 bg-purple-50 text-purple-600 shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:border-purple-500/20 dark:bg-[#241540] dark:text-purple-400',
}

  return (
    <div
  className={`rounded-[24px] border p-5 transition-all ${tones[tone]} ${
    document.documentElement.classList.contains('dark')
      ? 'border-transparent'
      : ''
  }`}
  style={{
    background:
      document.documentElement.classList.contains('dark')
        ? tone === 'blue'
          ? '#0B1F35'
          : tone === 'green'
          ? '#0B3328'
          : tone === 'red'
          ? '#3A1020'
          : '#241540'
        : undefined,
  }}
>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />

        <p className={`text-sm font-bold ${
  document.documentElement.classList.contains('dark')
    ? 'text-white'
    : 'text-slate-700'
}`}>
          {label}
        </p>
      </div>

      <p className={`mt-5 text-[30px] leading-none font-black ${
  document.documentElement.classList.contains('dark')
    ? 'text-white'
    : 'text-slate-950'
}`}>
        {value}
      </p>

      <p className={`mt-3 text-sm ${
  document.documentElement.classList.contains('dark')
    ? 'text-slate-300'
    : 'text-slate-500'
}`}>
        {description}
      </p>
    </div>
  )
}
  

function MiniTrend({ data = [] }: { data?: number[] }) {
  if (!data.length) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)

  const normalizeY = (value: number) => {
    if (max === min) return 50

    return 85 - ((value - min) / (max - min)) * 45
  }

  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100
      const y = normalizeY(value)

      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-[90px] w-[220px]"
    >
      <defs>
        <linearGradient id="miniArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
      </defs>

      <polygon
        fill="url(#miniArea)"
        points={`0,100 ${points} 100,100`}
      />

      <polyline
        fill="none"
        stroke="#22C55E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

function InfoLine({ label, value }: any) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <span className="text-sm font-semibold text-[var(--muted-foreground)]">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  )
}