'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Database,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  Sun,
  User2,
  X,
  Monitor,
  Smartphone,
  Presentation,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useFilters } from '../../store/use-filters'
import { useAuth } from '../../store/use-auth'
import { useRouter } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { ptBR } from 'date-fns/locale'

const NOTIF_SEEN_KEY = 'criare-notif-propostas-seen-percent'
const NOTIF_AUTO_CLOSE_MS = 30000

const CONTAS: Record<string, { nome: string; email: string; senha: string }> = {
  admin: {
    nome: 'Altuus Clinic',
    email: 'altuusclinic@gmail.com',
    senha: 'Altuus@2026#',
  },
  marketing: {
    nome: 'Bruno Fontanella',
    email: 'brunofontanella.ads@gmail.com',
    senha: 'Criare@Mkt9274#',
  },
}

function FiltroResumoCard({
  icon,
  label,
  valor,
  aberto,
  onClick,
}: {
  icon: ReactNode
  label: string
  valor: string
  aberto: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
        aberto
          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
          : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--metric-card)]'
      }`}
    >
      <span className="flex items-center gap-1.5 font-bold">
        {icon}
        {label}
      </span>

      <span className="flex shrink-0 items-center gap-1.5 text-[var(--muted-foreground)]">
        <span className="whitespace-nowrap font-semibold text-[var(--foreground)]">{valor}</span>
        {aberto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </span>
    </button>
  )
}

export function Topbar({ title, statusIndicator }: { title: string; statusIndicator?: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const {
  periodo,
  setPeriodo,
  tipoData,
  setTipoData,
  segmento,
  setSegmento,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  viewMode,
  setViewMode,
  comparar,
  setComparar,
} = useFilters()

  const { logout } = useAuth()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessao, setSessao] = useState<string | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [categoriaAberta, setCategoriaAberta] = useState<
    'tipoData' | 'periodo' | 'segmento' | 'dispositivo' | 'comparacao' | null
  >(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const notificationCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [propostasPercent, setPropostasPercent] = useState<number | null>(null)
  const [lastSeenPercent, setLastSeenPercent] = useState<number | null>(null)
  const [openMessage, setOpenMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)

    const stored = localStorage.getItem(NOTIF_SEEN_KEY)
    if (stored) setLastSeenPercent(Number(stored))

    const cookie = document.cookie.split('; ').find((c) => c.startsWith('criare-auth='))
    setSessao(cookie?.split('=')[1] || null)
  }, [])

  const conta = CONTAS[sessao || 'admin'] || CONTAS.admin

  useEffect(() => {
    let cancelled = false

    async function loadPropostasPercent() {
      try {
        const token = localStorage.getItem('access_token')

        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`
        if (periodo === 'personalizado' && dataInicio && dataFim) {
          url += `&inicio=${dataInicio}&fim=${dataFim}`
        }

        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        })

        const json = await res.json()
        if (cancelled || !json.ok) return

        const percent = json?.kpis?.comercialVendas?.propostasFechadasPercent
        if (typeof percent === 'number') {
          setPropostasPercent(Math.round(percent))
        }
      } catch {
        // silencioso: notificação depende de dado real, sem dado não há notificação
      }
    }

    loadPropostasPercent()
    const interval = setInterval(loadPropostasPercent, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [periodo, tipoData, segmento, dataInicio, dataFim])

  useEffect(() => {
    return () => {
      if (notificationCloseTimer.current) clearTimeout(notificationCloseTimer.current)
    }
  }, [])

  const notificationMessage =
    propostasPercent !== null && propostasPercent >= 70
      ? `Propostas fechadas acima de ${propostasPercent}% da meta. Continue assim!`
      : null

  const hasNotification =
    notificationMessage !== null && propostasPercent !== lastSeenPercent

  function handleOpenNotifications() {
    if (!hasNotification || !notificationMessage || propostasPercent === null) return

    setOpenMessage(notificationMessage)
    setShowNotifications(true)
    localStorage.setItem(NOTIF_SEEN_KEY, String(propostasPercent))
    setLastSeenPercent(propostasPercent)

    if (notificationCloseTimer.current) clearTimeout(notificationCloseTimer.current)
    notificationCloseTimer.current = setTimeout(() => {
      setShowNotifications(false)
    }, NOTIF_AUTO_CLOSE_MS)
  }

  function handleCloseNotifications() {
    setShowNotifications(false)
    if (notificationCloseTimer.current) clearTimeout(notificationCloseTimer.current)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node

      if (calendarRef.current && !calendarRef.current.contains(target)) {
        setShowCalendar(false)
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfile(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleRefresh() {
    window.location.reload()
  }

  function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    setIsFullscreen(true)
  } else {
    document.exitFullscreen()
    setIsFullscreen(false)
  }
}

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const groupClass = 'flex flex-wrap items-center gap-1.5 rounded-[20px] bg-[var(--card)] p-2'
 const pillBase =
  'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap'
  const pillActive = 'bg-[var(--accent)] text-[var(--background)] shadow-sm'
  const pillInactive = 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'

function parseLocalDate(dateString?: string) {
  if (!dateString) return undefined

  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
  return (
    <header className="z-30 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex flex-col gap-3 px-6 pt-4 pb-1 md:px-8">
        <div className="flex items-start justify-between gap-6">
       
          <div className="flex-1 space-y-4">
            <h1 className="text-5xl font-black tracking-[-0.06em]">{title}</h1>
</div>
<div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-3 rounded-[18px] bg-[var(--card)] px-4 py-3 transition-colors duration-200 hover:bg-[var(--metric-card)]"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
              <span className="font-medium">
                {mounted && (resolvedTheme === 'dark' ? 'Claro' : 'Escuro')}
              </span>
            </button>

            <button
              onClick={handleRefresh}
              className="rounded-[18px] bg-[var(--card)] p-3 transition-colors duration-200 hover:bg-[var(--metric-card)]"
            >
              <RefreshCw size={18} />
            </button>

            <button
  onClick={toggleFullscreen}
  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
  className="rounded-[18px] bg-[var(--card)] p-3 transition-colors duration-200 hover:bg-[var(--metric-card)]"
>
  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
</button>

            <button className="rounded-[18px] bg-[var(--card)] p-3 transition-colors duration-200 hover:bg-[var(--metric-card)]">
              <Search size={18} />
            </button>

            <div ref={notificationRef} className="relative">
              <button
                onClick={handleOpenNotifications}
                className="relative rounded-[18px] bg-[var(--card)] p-3 transition-colors duration-200 hover:bg-[var(--metric-card)]"
              >
                <Bell size={18} />
                {hasNotification && (
  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
    1
  </span>
)}
              </button>

              {showNotifications && openMessage && (
  <div className="absolute right-0 top-full mt-3 w-[360px] rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
    <div className="mb-4 flex items-center justify-between">
      <div className="text-lg font-bold">Notificações</div>

      <button
        onClick={handleCloseNotifications}
        className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--metric-card)] hover:text-[var(--foreground)]"
      >
        <X size={18} />
      </button>
    </div>

    <div className="space-y-3">
      <div className="rounded-[18px] bg-[var(--success)]/10 p-4 text-[var(--success)]">
        {openMessage}
      </div>
    </div>
  </div>
)}
            </div>

            <div ref={profileRef} className="relative">
              <button
  onClick={() => setShowProfile((v) => !v)}
  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-[var(--background)] ring-2 ring-transparent transition-all duration-200 hover:ring-[var(--accent)]/40"
>
  <img
    src="/altuus-logo.png"
    alt="Altuus Clinic"
    className="h-full w-full rounded-full object-cover"
  />
</button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-3 w-[360px] rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="text-2xl font-bold">Minha conta</div>
                    <button onClick={() => setShowProfile(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mb-5 flex items-center gap-4">
                   <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)]">
  <img
    src="/altuus-logo.png"
    alt="Altuus Clinic"
    className="h-full w-full object-cover"
  />
</div>

                    <div>
                      <div className="text-xl font-semibold">{conta.nome}</div>
                      <div className="text-[var(--muted-foreground)]">{conta.email}</div>
                    </div>
                  </div>

                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Senha
                  </div>

                  <div className="mb-4 flex items-center justify-between rounded-2xl bg-[var(--background)] px-4 py-3">
                    <span>{showPassword ? conta.senha : '••••••••'}</span>
                    <button onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <button className="mb-6 text-[var(--accent)]">
                    Alterar senha
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-[var(--danger)]"
                  >
                    <LogOut size={20} />
                    Sair
                  </button>
                </div>
              )}
             </div>
             </div>
              </div>
           

<div className="rounded-[18px] bg-[var(--card)] px-5 py-3 shadow-sm">

  <div
    onClick={() => {
      setShowFilters((atual) => !atual)
      setCategoriaAberta(null)
    }}
    className="flex cursor-pointer items-center justify-between gap-3"
  >
  <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 pr-3 font-bold">
        <SlidersHorizontal size={18} className="text-[var(--accent)]" />
        Filtros aplicados
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold">
        {tipoData === 'criado' ? 'Criado' : 'Fechado'}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold">
  {periodo === 'hoje'
    ? 'Hoje'
    : periodo === 'ontem'
    ? 'Ontem'
    : periodo === 'semana'
    ? 'Semana'
    : periodo === 'mes-atual'
    ? 'Mês atual'
    : periodo === 'mes-passado'
    ? 'Mês passado'
    : dataInicio && dataFim
    ? `Personalizado (${parseLocalDate(dataInicio)?.toLocaleDateString('pt-BR')} a ${parseLocalDate(dataFim)?.toLocaleDateString('pt-BR')})`
    : 'Personalizado'}
</div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold">
        {segmento === 'vascular'
          ? 'Vascular'
          : segmento === 'emagrecimento'
          ? 'Emagrecimento'
          : 'Geral'}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold">
        {viewMode === 'desktop'
          ? 'iMac'
          : viewMode === 'iphone'
          ? 'iPhone'
          : 'Apresentação'}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold">
  {comparar ? 'Comparando' : 'Sem comparação'}
</div>
    </div>

    <div className="ml-auto flex shrink-0 items-center gap-4">
  {statusIndicator}

  <div className="text-[var(--accent)]">
    {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
  </div>
</div>

  </div>
  {showFilters && (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-3 xl:grid-cols-5">
      <div>
        <FiltroResumoCard
          icon={<Database size={15} className="text-[var(--accent)]" />}
          label="Tipo de data"
          valor={tipoData === 'criado' ? 'Criado' : 'Fechado'}
          aberto={categoriaAberta === 'tipoData'}
          onClick={() =>
            setCategoriaAberta((atual) => (atual === 'tipoData' ? null : 'tipoData'))
          }
        />

        {categoriaAberta === 'tipoData' && (
          <div className={`${groupClass} mt-3`}>
            <button
              onClick={() => {
                setTipoData('criado')
                setCategoriaAberta(null)
              }}
              className={`${pillBase} ${tipoData === 'criado' ? pillActive : pillInactive}`}
            >
              <Database size={16} />
              Criado
            </button>

            <button
              onClick={() => {
                setTipoData('fechado')
                setCategoriaAberta(null)
              }}
              className={`${pillBase} ${tipoData === 'fechado' ? pillActive : pillInactive}`}
            >
              <Database size={16} />
              Fechado
            </button>
          </div>
        )}
      </div>

      <div>
        <FiltroResumoCard
          icon={<CalendarDays size={15} className="text-[var(--accent)]" />}
          label="Período"
          valor={
            periodo === 'hoje'
              ? 'Hoje'
              : periodo === 'ontem'
                ? 'Ontem'
                : periodo === 'semana'
                  ? 'Semana'
                  : periodo === 'mes-atual'
                    ? 'Mês atual'
                    : periodo === 'mes-passado'
                      ? 'Mês passado'
                      : 'Personalizado'
          }
          aberto={categoriaAberta === 'periodo'}
          onClick={() =>
            setCategoriaAberta((atual) => (atual === 'periodo' ? null : 'periodo'))
          }
        />

        {categoriaAberta === 'periodo' && (
        <div className={`${groupClass} mt-3`}>
          <button
            onClick={() => {
              setPeriodo('hoje')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${periodo === 'hoje' ? pillActive : pillInactive}`}
          >
            Hoje
          </button>

          <button
            onClick={() => {
              setPeriodo('ontem')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${periodo === 'ontem' ? pillActive : pillInactive}`}
          >
            Ontem
          </button>

          <button
            onClick={() => {
              setPeriodo('semana')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${periodo === 'semana' ? pillActive : pillInactive}`}
          >
            Semana
          </button>

          <button
            onClick={() => {
              setPeriodo('mes-atual')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${periodo === 'mes-atual' ? pillActive : pillInactive}`}
          >
            Mês atual
          </button>

          <button
            onClick={() => {
              setPeriodo('mes-passado')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${periodo === 'mes-passado' ? pillActive : pillInactive}`}
          >
            Mês passado
          </button>

          <div ref={calendarRef} className="relative">
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className={`${pillBase} ${periodo === 'personalizado' ? pillActive : pillInactive}`}
            >
              <CalendarDays size={16} />
              Personalizado
            </button>

            {showCalendar && (
              <>
              <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setShowCalendar(false)}
              />
              <div className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2.5rem)] w-[360px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] border border-[var(--border)] bg-[var(--card)] shadow-2xl">
                <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]">
                    <CalendarDays size={16} />
                  </div>

                  <div>
                    <p className="text-lg font-bold">Selecione o período</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Escolha a data inicial e final no calendário
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-col items-center px-4 py-3">
                  <DayPicker
                    locale={ptBR}
                    mode="range"
                    selected={{
                      from: parseLocalDate(dataInicio),
                      to: parseLocalDate(dataFim),
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        const ano = range.from.getFullYear()
                        const mes = String(range.from.getMonth() + 1).padStart(2, '0')
                        const dia = String(range.from.getDate()).padStart(2, '0')
                        setDataInicio(`${ano}-${mes}-${dia}`)
                      }

                      if (range?.to) {
                        const ano = range.to.getFullYear()
                        const mes = String(range.to.getMonth() + 1).padStart(2, '0')
                        const dia = String(range.to.getDate()).padStart(2, '0')
                        setDataFim(`${ano}-${mes}-${dia}`)
                      }
                    }}
                    numberOfMonths={1}
                    className="text-sm"
                    classNames={{
                      months: 'relative flex w-full justify-center',
                      month: 'w-full max-w-[300px] space-y-1',
                      month_caption:
'relative flex h-10 items-center justify-center text-[18px] font-bold capitalize',
                      caption_label: 'text-[18px] font-bold capitalize',
                      nav:
'absolute left-1/2 top-0 z-10 flex h-10 w-full max-w-[300px] -translate-x-1/2 items-center justify-between',
                      button_previous:
                        'flex h-10 w-10 items-center justify-center rounded-xl text-[var(--foreground)] hover:bg-[var(--metric-card)]',
                      button_next:
                        'flex h-10 w-10 items-center justify-center rounded-xl text-[var(--foreground)] hover:bg-[var(--metric-card)]',
                      chevron: 'h-6 w-6 text-[var(--foreground)]',
                      weekdays: 'grid grid-cols-7 gap-2 text-center',
                      weekday: 'text-sm font-bold text-[var(--muted-foreground)]',
                      weeks: 'space-y-2',
                      week: 'grid grid-cols-7 gap-2',
                      day: 'h-8 w-8',
                      day_button:
'flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--metric-card)] text-[13px] font-semibold text-[var(--foreground)] transition hover:bg-[var(--accent)]/25',
                      selected:
                        'bg-[var(--accent)] text-white rounded-2xl',
                      range_start:
                        '[&>button]:bg-[var(--accent)] [&>button]:text-white',
                      range_end:
                        '[&>button]:bg-[var(--accent)] [&>button]:text-white',
                      range_middle:
                        '[&>button]:bg-[var(--accent)]/15 [&>button]:text-[var(--foreground)]',
                      today:
                        '[&>button]:bg-[var(--metric-card)] [&>button]:border [&>button]:border-[var(--accent)] [&>button]:text-[var(--foreground)]',
                    }}
                  />

                  <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Período selecionado
                      </p>
                      <p className="font-semibold">
                        {dataInicio && dataFim
                          ? `${parseLocalDate(dataInicio)?.toLocaleDateString('pt-BR')} até ${parseLocalDate(dataFim)?.toLocaleDateString('pt-BR')}`
                          : 'Selecione início e fim'}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <button
                        onClick={() => {
                          setDataInicio('')
                          setDataFim('')
                        }}
                        className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold"
                      >
                        Limpar
                      </button>

                      <button
                        onClick={() => {
                          setPeriodo('personalizado')
                          setShowCalendar(false)
                        }}
                        className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--background)]"
                      >
                        Aplicar período
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>

      <div>
        <FiltroResumoCard
          icon={<Activity size={15} className="text-[var(--accent)]" />}
          label="Segmento"
          valor={
            segmento === 'vascular'
              ? 'Vascular'
              : segmento === 'emagrecimento'
                ? 'Emagrecimento'
                : 'Geral'
          }
          aberto={categoriaAberta === 'segmento'}
          onClick={() =>
            setCategoriaAberta((atual) => (atual === 'segmento' ? null : 'segmento'))
          }
        />

        {categoriaAberta === 'segmento' && (
        <div className={`${groupClass} mt-3`}>
          <button
            onClick={() => {
              setSegmento('vascular')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${segmento === 'vascular' ? pillActive : pillInactive}`}
          >
            <Activity size={16} />
            Vascular
          </button>

          <button
            onClick={() => {
              setSegmento('emagrecimento')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${segmento === 'emagrecimento' ? pillActive : pillInactive}`}
          >
            <Heart size={16} />
            Emagrecimento
          </button>

          <button
            onClick={() => {
              setSegmento('geral')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${segmento === 'geral' ? pillActive : pillInactive}`}
          >
            <BarChart3 size={16} />
            Geral
          </button>
        </div>
        )}
      </div>

      <div>
        <FiltroResumoCard
          icon={<Monitor size={15} className="text-[var(--accent)]" />}
          label="Dispositivo"
          valor={
            viewMode === 'desktop'
              ? 'iMac'
              : viewMode === 'iphone'
                ? 'iPhone'
                : 'Apresentação'
          }
          aberto={categoriaAberta === 'dispositivo'}
          onClick={() =>
            setCategoriaAberta((atual) => (atual === 'dispositivo' ? null : 'dispositivo'))
          }
        />

        {categoriaAberta === 'dispositivo' && (
        <div className={`${groupClass} mt-3`}>
          <button
            onClick={() => {
              setViewMode('desktop')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${viewMode === 'desktop' ? pillActive : pillInactive}`}
          >
            <Monitor size={16} />
            iMac
          </button>

          <button
            onClick={() => {
              setViewMode('iphone')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${viewMode === 'iphone' ? pillActive : pillInactive}`}
          >
            <Smartphone size={16} />
            iPhone
          </button>

          <button
            onClick={() => {
              setViewMode('apresentacao')
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${viewMode === 'apresentacao' ? pillActive : pillInactive}`}
          >
            <Presentation size={16} />
            Apresentação
          </button>
        </div>
        )}
      </div>

      <div>
        <FiltroResumoCard
          icon={<BarChart3 size={15} className="text-[var(--accent)]" />}
          label="Comparação"
          valor={comparar ? 'Comparar' : 'Sem comparar'}
          aberto={categoriaAberta === 'comparacao'}
          onClick={() =>
            setCategoriaAberta((atual) => (atual === 'comparacao' ? null : 'comparacao'))
          }
        />

        {categoriaAberta === 'comparacao' && (
        <div className={`${groupClass} mt-3`}>
          <button
            onClick={() => {
              setComparar(false)
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${!comparar ? pillActive : pillInactive}`}
          >
            Sem comparar
          </button>

          <button
            onClick={() => {
              setComparar(true)
              setCategoriaAberta(null)
            }}
            className={`${pillBase} ${comparar ? pillActive : pillInactive}`}
          >
            Comparar
          </button>
        </div>
        )}
      </div>

    </div>
  )}
</div>
          </div>

    </header>
  )
}