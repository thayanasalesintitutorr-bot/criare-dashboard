'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Star, Stethoscope, Users } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import { useAuth } from '../../store/use-auth'

type EvolucaoDiariaItem = {
  data: string
  label: string
  leads: number
  vendasValor: number
  desqualificados: number
}

type OrigemItem = {
  nome: string
  quantidade: number
}

type DashboardResponse = {
  ok: boolean
  kpis?: {
    marketing: {
      totalEntradas: number
      naoQualificados: number
      naoQualificadosPercent: number
      leadsAceitos: number
      leadsAceitosPercent: number
      agendados: number
      agendadosPercent: number
    }
    comercialConsulta: {
      quantidadeConsulta: number
      valorTotalConsulta: number
      ticketMedioConsulta: number
    }
    comercialVendas: {
      propostasEnviadas: number
      propostasFechadas: number
      propostasFechadasPercent: number
      valorTotalVendas: number
      ticketMedioVendas: number
      metaPropostasFechadasPercent: number
      metaValorTotalVendas: number
      metaTicketMedio: number
    }
  }
  consolidado?: {
    qtdVendas: number
    valorVendas: number
    ticketMedio: number
    evolucaoConsulta?: number[]
    metaValorVendas: number
    metaTicketMedio: number
  }
  funil?: any
  funilVendas?: any
  evolucaoDiaria?: EvolucaoDiariaItem[]
  origens?: OrigemItem[]
  error?: string
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function tp() {
  return 'text-slate-900 dark:text-white'
}

function cb() {
  return 'border border-black/5 bg-white/80 shadow-md'
}

function GroupCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className={`rounded-[28px] p-6 ${cb()}`}>
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
          {icon}
        </div>
        <h3 className={`text-xl font-bold ${tp()}`}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

export default function DashboardPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login')
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return

    async function loadData() {
      try {
        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`

        if (periodo === 'personalizado') {
          url += `&inicio=${dataInicio}&fim=${dataFim}`
        }

        const res = await fetch(url)
        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [periodo, tipoData, segmento, dataInicio, dataFim, isLoggedIn])

  if (loading) return <div>Carregando...</div>

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-4 gap-6">
        <GroupCard title="Marketing" icon={<ClipboardList />}>
          <p>Total Leads: {data?.kpis?.marketing.totalEntradas}</p>
        </GroupCard>

        <GroupCard title="Consultas" icon={<Stethoscope />}>
          <p>Qtd: {data?.kpis?.comercialConsulta.quantidadeConsulta}</p>
        </GroupCard>

        <GroupCard title="Vendas" icon={<Users />}>
          <p>Valor: {formatMoney(data?.kpis?.comercialVendas.valorTotalVendas || 0)}</p>
        </GroupCard>

        <GroupCard title="Experiência" icon={<Star />}>
          <p>Em breve</p>
        </GroupCard>
      </div>
    </AppShell>
  )
}