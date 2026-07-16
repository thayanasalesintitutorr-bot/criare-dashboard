'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  LayoutGrid,
} from 'lucide-react'

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

type MetricaChave = keyof ProjecaoMetricas

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

// Fraseado natural para os insights automáticos (só as 3 métricas principais aparecem aqui).
const UNIDADE_METRICA: Record<string, string> = {
  seguidores: 'seguidores',
  posts: 'publicações',
  engajamento: 'interações de engajamento',
}

const VERBO_ESTAR: Record<string, string> = {
  seguidores: 'estão',
  posts: 'estão',
  engajamento: 'está',
}

const VERBO_SUPERAR: Record<string, string> = {
  seguidores: 'superaram',
  posts: 'superaram',
  engajamento: 'superou',
}

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

// Escala de status: >=95 excelente · 75-94 bom · 50-74 abaixo da meta · <50 muito abaixo.
function tierDoPercent(percent: number | null) {
  if (percent === null) {
    return { cor: 'var(--muted-foreground)', label: 'Sem dados' }
  }
  if (percent >= 95) return { cor: 'var(--success)', label: 'Acima da meta' }
  if (percent >= 75) return { cor: 'var(--warning)', label: 'Dentro da meta' }
  if (percent >= 50) return { cor: 'var(--chart-orange)', label: 'Abaixo da meta' }
  return { cor: 'var(--danger)', label: 'Muito abaixo da meta' }
}

function mediaPercentual(valores: (number | null)[]): number | null {
  const validos = valores.filter((v): v is number => v !== null)
  if (validos.length === 0) return null
  return validos.reduce((acc, v) => acc + v, 0) / validos.length
}

type Kpi = {
  chave: MetricaChave
  label: string
  meta: number
  atual: number | null
  percent: number | null
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  const Icon = ICONES_METRICA[kpi.chave]
  const metrica = PROJECAO_METRICAS.find((m) => m.chave === kpi.chave)!
  const tier = tierDoPercent(kpi.percent)
  const largura = kpi.percent === null ? 0 : Math.min(Math.max(kpi.percent, 3), 100)

  return (
    <div className="rounded-[16px] border border-[color:var(--border)] bg-[var(--metric-card)] px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
        <Icon size={12} />
        {metrica.label}
      </div>

      <div className="mt-1 text-[24px] font-black leading-none tracking-[-0.02em]" style={{ color: tier.cor }}>
        {kpi.percent !== null ? `${Math.round(kpi.percent)}%` : '—'}
      </div>

      <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-[var(--progress-bg)]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: tier.cor }}
          initial={{ width: 0 }}
          animate={{ width: `${largura}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-bold leading-tight text-[var(--foreground)]">
          {kpi.atual !== null ? metrica.formatar(kpi.atual) : 'Sem dados'}
        </span>
        <span className="shrink-0 text-[10px] font-semibold text-[var(--muted-foreground)]">
          Meta {metrica.formatar(kpi.meta)}
        </span>
      </div>
    </div>
  )
}

function InsightTile({
  tipo,
  texto,
}: {
  tipo: 'desafio' | 'destaque'
  texto: string
}) {
  const positivo = tipo === 'destaque'

  return (
    <div
      className={`flex items-start gap-2.5 rounded-[16px] border p-3 ${
        positivo
          ? 'border-[var(--success)]/25 bg-[var(--success)]/10'
          : 'border-[var(--warning)]/25 bg-[var(--warning)]/10'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${positivo ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
        {positivo ? <Sparkles size={15} /> : <TrendingDown size={15} />}
      </span>

      <div className="min-w-0">
        <div
          className={`text-[10px] font-black uppercase tracking-[0.08em] ${
            positivo ? 'text-[var(--success)]' : 'text-[var(--warning)]'
          }`}
        >
          {positivo ? 'Destaque positivo' : 'Principal desafio'}
        </div>
        <div className="mt-0.5 text-[13px] font-semibold leading-snug text-[var(--foreground)]">{texto}</div>
      </div>
    </div>
  )
}

function construirInsights(kpis: Kpi[]) {
  const comDados = kpis.filter((k) => k.atual !== null && k.percent !== null)
  if (comDados.length === 0) return { desafio: null as string | null, destaque: null as string | null }

  const ordenado = [...comDados].sort((a, b) => (a.percent as number) - (b.percent as number))
  const pior = ordenado[0]
  const melhor = ordenado[ordenado.length - 1]

  const metricaFormatar = (chave: MetricaChave, v: number) =>
    PROJECAO_METRICAS.find((m) => m.chave === chave)!.formatar(Math.abs(v))

  let desafio: string | null = null
  if ((pior.percent as number) < 100) {
    const gap = pior.meta - (pior.atual as number)
    desafio = `Faltam ${metricaFormatar(pior.chave, gap)} ${UNIDADE_METRICA[pior.chave]} para atingir a meta.`
  }

  let destaque: string | null = null
  const alvoDestaque = comDados.length > 1 ? melhor : pior
  if (alvoDestaque && !(desafio && alvoDestaque.chave === pior.chave && comDados.length === 1)) {
    if ((alvoDestaque.percent as number) >= 100) {
      const excedente = (alvoDestaque.atual as number) - alvoDestaque.meta
      destaque =
        excedente > 0
          ? `${alvoDestaque.label} já ${VERBO_SUPERAR[alvoDestaque.chave]} a meta em ${metricaFormatar(alvoDestaque.chave, excedente)}.`
          : `${alvoDestaque.label} bateu a meta em cheio.`
    } else {
      const gap = alvoDestaque.meta - (alvoDestaque.atual as number)
      destaque = `${alvoDestaque.label} ${VERBO_ESTAR[alvoDestaque.chave]} a apenas ${metricaFormatar(alvoDestaque.chave, gap)} da meta.`
    }
  }

  return { desafio, destaque }
}

function Avatar({ nome, foto, size = 'md' }: { nome: string; foto: string | null; size?: 'md' | 'lg' }) {
  const dimensao = size === 'lg' ? 'h-16 w-16' : 'h-7 w-7'
  const fonte = size === 'lg' ? 'text-[20px]' : 'text-[11px]'

  return (
    <span
      className={`${dimensao} shrink-0 overflow-hidden rounded-full border border-[color:var(--accent)]/30 bg-[var(--metric-card)]`}
    >
      {foto ? (
        <img src={foto} alt={nome} className="h-full w-full object-cover" />
      ) : (
        <span className={`flex h-full w-full items-center justify-center ${fonte} font-black text-[var(--accent)]`}>
          {nome.charAt(0)}
        </span>
      )}
    </span>
  )
}

type SlideMedico = {
  tipo: 'medico'
  chave: MedicoChave
  nome: string
  foto: string | null
  kpis: Kpi[]
  temDados: boolean
}

type SlideGeral = {
  tipo: 'geral'
}

type Slide = SlideMedico | SlideGeral

export function ProjecaoMedicosResumoCard({
  periodo,
  dataInicio,
}: {
  periodo: string
  dataInicio?: string
}) {
  const [projecao, setProjecao] = useState<ProjecaoPorMedico | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [indice, setIndice] = useState(0)
  const [direcao, setDirecao] = useState(1)
  const touchX = useRef<number | null>(null)

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

  const slides = useMemo<Slide[]>(() => {
    if (!projecao) return []

    const medicos = Object.keys(projecao) as MedicoChave[]

    const slidesMedicos: SlideMedico[] = medicos.map((chave) => {
      const linha = projecao[chave].meses.find((m) => m.ordem === ordemAlvo) ?? null

      const kpis: Kpi[] = METRICAS_PRINCIPAIS.map(({ chave: metricaChave }) => {
        const metrica = PROJECAO_METRICAS.find((m) => m.chave === metricaChave)!
        const meta = linha?.meta?.[metricaChave] ?? 0
        const atual = linha?.atual?.[metricaChave] ?? null

        return {
          chave: metricaChave,
          label: metrica.label,
          meta,
          atual,
          percent: calcularPercentual(atual, meta),
        }
      })

      return {
        tipo: 'medico',
        chave,
        nome: projecao[chave].nome,
        foto: FOTOS_MEDICO[chave] ?? null,
        kpis,
        temDados: Boolean(linha),
      }
    })

    return [...slidesMedicos, { tipo: 'geral' }]
  }, [projecao, ordemAlvo])

  if (!projecao) {
    return (
      <section className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] px-4 py-3 shadow-[var(--card-shadow)]">
        <div className="text-xs font-bold text-[var(--muted-foreground)]">
          {erro ? erro : 'Carregando projeção dos médicos...'}
        </div>
      </section>
    )
  }

  const total = slides.length
  const indiceSeguro = Math.min(indice, total - 1)
  const atual = slides[indiceSeguro]

  function ir(proximo: number) {
    setDirecao(proximo > indiceSeguro ? 1 : -1)
    setIndice(((proximo % total) + total) % total)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return
    const delta = e.changedTouches[0].clientX - touchX.current
    touchX.current = null

    if (Math.abs(delta) < 40) return
    ir(indiceSeguro + (delta < 0 ? 1 : -1))
  }

  const variantes = {
    entra: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
    centro: { x: 0, opacity: 1 },
    sai: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.08em] text-[var(--foreground)]">
          <TrendingUp size={16} className="text-[var(--accent)]" />
          Projeção dos médicos
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => ir(indiceSeguro - 1)}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] sm:flex"
            aria-label="Anterior"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === indiceSeguro ? 'w-5 bg-[var(--accent)]' : 'w-1.5 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => ir(indiceSeguro + 1)}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)] sm:flex"
            aria-label="Próximo"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div
        className="relative min-h-[380px] overflow-hidden px-5 py-5"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direcao} initial={false}>
          <motion.div
            key={indiceSeguro}
            custom={direcao}
            variants={variantes}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {atual.tipo === 'medico' ? (
              <SlideMedicoConteudo slide={atual} nomeMes={nomeMes} />
            ) : (
              <SlideGeralConteudo slides={slides} nomeMes={nomeMes} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-[color:var(--border)] px-5 py-2 text-center text-[11px] font-semibold text-[var(--muted-foreground)] sm:hidden">
        Deslize para o lado · {indiceSeguro + 1} de {total}
      </div>
    </section>
  )
}

function SlideMedicoConteudo({ slide, nomeMes }: { slide: SlideMedico; nomeMes: string }) {
  const percentGeral = mediaPercentual(slide.kpis.map((k) => k.percent))
  const tierGeral = tierDoPercent(percentGeral)
  const { desafio, destaque } = construirInsights(slide.kpis)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-1 text-center sm:w-[27%] sm:items-start sm:text-left">
          <Avatar nome={slide.nome} foto={slide.foto} size="lg" />

          <div className="mt-1 text-[20px] font-black leading-tight text-[var(--foreground)]">{slide.nome}</div>
          {nomeMes && (
            <div className="text-[13px] font-semibold text-[var(--muted-foreground)]">{nomeMes}</div>
          )}

          {slide.temDados ? (
            <div className="mt-2">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                Desempenho geral
              </div>
              <div
                className="text-[44px] font-black leading-none tracking-[-0.02em]"
                style={{ color: tierGeral.cor }}
              >
                {percentGeral !== null ? `${Math.round(percentGeral)}%` : '—'}
              </div>
              <div className="text-[13px] font-bold" style={{ color: tierGeral.cor }}>
                {tierGeral.label}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-[13px] font-semibold text-[var(--muted-foreground)]">
              Sem dados de projeção para {nomeMes || 'este período'}
            </div>
          )}
        </div>

        {slide.temDados && (
          <div className="flex-1 space-y-2.5">
            {slide.kpis.map((kpi) => (
              <KpiTile key={kpi.chave} kpi={kpi} />
            ))}
          </div>
        )}
      </div>

      {slide.temDados && (desafio || destaque) && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {destaque && <InsightTile tipo="destaque" texto={destaque} />}
          {desafio && <InsightTile tipo="desafio" texto={desafio} />}
        </div>
      )}
    </div>
  )
}

function SlideGeralConteudo({ slides, nomeMes }: { slides: Slide[]; nomeMes: string }) {
  const medicos = slides.filter((s): s is SlideMedico => s.tipo === 'medico')
  const comDados = medicos.filter((m) => m.temDados)

  const totais = METRICAS_PRINCIPAIS.map(({ chave }) => {
    const metrica = PROJECAO_METRICAS.find((m) => m.chave === chave)!
    const valores = comDados.map((m) => m.kpis.find((k) => k.chave === chave)?.atual ?? null)
    const validos = valores.filter((v): v is number => v !== null)
    const soma = validos.length > 0 ? validos.reduce((acc, v) => acc + v, 0) : null

    return {
      chave,
      label: metrica.label,
      valor: soma !== null ? metrica.formatar(soma) : 'Sem dados',
    }
  })

  const percentualMedioGeral = mediaPercentual(
    comDados.map((m) => mediaPercentual(m.kpis.map((k) => k.percent)))
  )
  const tierMedio = tierDoPercent(percentualMedioGeral)

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[color:var(--accent)]/30 bg-[var(--metric-card)] text-[var(--accent)]">
          <LayoutGrid size={26} />
        </span>

        <div className="mt-1 text-[22px] font-black leading-tight text-[var(--foreground)]">Visão geral</div>
        {nomeMes && <div className="text-[13px] font-semibold text-[var(--muted-foreground)]">{nomeMes}</div>}

        <div className="mt-2">
          <div className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
            Percentual médio das metas
          </div>
          <div className="text-[46px] font-black leading-none tracking-[-0.02em]" style={{ color: tierMedio.cor }}>
            {percentualMedioGeral !== null ? `${Math.round(percentualMedioGeral)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {totais.map((item) => (
          <div
            key={item.chave}
            className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4 text-center"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
              {item.label} totais
            </div>
            <div className="mt-1 text-[26px] font-black leading-none text-[var(--foreground)]">{item.valor}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
        <div className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
          Comparativo por médico
        </div>

        <div className="space-y-3">
          {medicos.map((medico) => {
            const percent = medico.temDados ? mediaPercentual(medico.kpis.map((k) => k.percent)) : null
            const tier = tierDoPercent(percent)
            const largura = percent === null ? 0 : Math.min(Math.max(percent, 3), 100)

            return (
              <div key={medico.chave}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar nome={medico.nome} foto={medico.foto} />
                    <span className="truncate text-[13px] font-bold text-[var(--foreground)]">{medico.nome}</span>
                  </div>

                  <span className="shrink-0 text-[13px] font-black" style={{ color: tier.cor }}>
                    {percent !== null ? `${Math.round(percent)}%` : '—'}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--progress-bg)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: tier.cor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${largura}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
