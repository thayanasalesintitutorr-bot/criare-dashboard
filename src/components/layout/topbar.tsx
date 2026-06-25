'use client'

import { useEffect, useRef, useState } from 'react'
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


export function Topbar({ title }: { title: string }) {
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
} = useFilters()

  const { logout } = useAuth()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [hideNotifications, setHideNotifications] = useState(false)
  const [hasNotification, setHasNotification] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const calendarRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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
  'inline-flex items-center gap-3 rounded-xl px-5 py-3 text-[18px] font-semibold transition-all whitespace-nowrap'
  const pillActive = 'bg-[var(--accent)] text-[var(--background)] shadow-sm'
  const pillInactive = 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'

function parseLocalDate(dateString?: string) {
  if (!dateString) return undefined

  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
  return (
    <header className="z-30 border-b border-white/5 bg-[var(--background)]">
      <div className="flex flex-col gap-4 px-6 py-5 md:px-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <h1 className="text-5xl font-black tracking-[-0.06em]">{title}</h1>

<div className="mb-4 rounded-[28px] bg-[var(--card)] p-5 shadow-sm">
  <div className="flex items-center justify-between gap-6">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 pr-3 font-bold">
        <SlidersHorizontal size={18} className="text-[var(--accent)]" />
        Filtros aplicados
      </div>

      <div className="rounded-xl border border-black/10 bg-[var(--background)] px-4 py-2 text-sm font-semibold">
        {tipoData === 'criado' ? 'Criado' : 'Fechado'}
      </div>

      <div className="rounded-xl border border-black/10 bg-[var(--background)] px-4 py-2 text-sm font-semibold">
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
          : 'Personalizado'}
      </div>

      <div className="rounded-xl border border-black/10 bg-[var(--background)] px-4 py-2 text-sm font-semibold">
        {segmento === 'vascular'
          ? 'Vascular'
          : segmento === 'emagrecimento'
          ? 'Emagrecimento'
          : 'Geral'}
      </div>

      <div className="rounded-xl border border-black/10 bg-[var(--background)] px-4 py-2 text-sm font-semibold">
        {viewMode === 'desktop' ? 'iMac' : 'iPhone'}
      </div>
    </div>

    <button
      onClick={() => setShowFilters(!showFilters)}
      className="flex items-center gap-2 font-semibold text-[var(--accent)]"
    >
      {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
      {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  </div>

  {showFilters && (
    <div className="mt-6 grid grid-cols-4 gap-6 border-t border-black/5 pt-6">
      <div>
        <div className="mb-3 flex items-center gap-2 font-bold">
          <Database size={18} className="text-[var(--accent)]" />
          Tipo de data
        </div>

        <div className={groupClass}>
          <button
            onClick={() => setTipoData('criado')}
            className={`${pillBase} ${tipoData === 'criado' ? pillActive : pillInactive}`}
          >
            <Database size={20} />
            Criado
          </button>

          <button
            onClick={() => setTipoData('fechado')}
            className={`${pillBase} ${tipoData === 'fechado' ? pillActive : pillInactive}`}
          >
            <Database size={20} />
            Fechado
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-bold">
          <CalendarDays size={18} className="text-[var(--accent)]" />
          Período
        </div>

        <div className={groupClass}>
          <button
            onClick={() => setPeriodo('hoje')}
            className={`${pillBase} ${periodo === 'hoje' ? pillActive : pillInactive}`}
          >
            Hoje
          </button>

          <button
            onClick={() => setPeriodo('ontem')}
            className={`${pillBase} ${periodo === 'ontem' ? pillActive : pillInactive}`}
          >
            Ontem
          </button>

          <button
            onClick={() => setPeriodo('semana')}
            className={`${pillBase} ${periodo === 'semana' ? pillActive : pillInactive}`}
          >
            Semana
          </button>

          <button
            onClick={() => setPeriodo('mes-atual')}
            className={`${pillBase} ${periodo === 'mes-atual' ? pillActive : pillInactive}`}
          >
            Mês atual
          </button>

          <button
            onClick={() => setPeriodo('mes-passado')}
            className={`${pillBase} ${periodo === 'mes-passado' ? pillActive : pillInactive}`}
          >
            Mês passado
          </button>

          <div ref={calendarRef} className="relative">
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className={`${pillBase} ${periodo === 'personalizado' ? pillActive : pillInactive}`}
            >
              <CalendarDays size={20} />
              Personalizado
            </button>

            {showCalendar && (
              <div className="absolute right-0 top-full z-50 mt-4 w-[520px] max-w-[95vw] rounded-[28px] border border-white/10 bg-[var(--card)] shadow-2xl">
                <div className="flex items-center gap-3 border-b border-black/5 px-6 py-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <p className="text-lg font-bold">Selecione o período</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Escolha a data inicial e final no calendário
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-col items-center px-5 py-4">
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
                      months: 'flex justify-center',
                      month: 'w-[430px] space-y-4 pl-4',
                      month_caption:
                        'relative flex items-center justify-center text-[28px] font-black capitalize',
                      caption_label: 'text-[28px] font-black capitalize',
                      nav:
                        'absolute left-1/2 top-[145px] z-10 flex w-[520px] -translate-x-1/2 items-center justify-between px-6',
                      button_previous:
                        'flex h-10 w-10 items-center justify-center rounded-xl text-black hover:bg-[var(--muted)]',
                      button_next:
                        'flex h-10 w-10 items-center justify-center rounded-xl text-black hover:bg-[var(--muted)]',
                      chevron: 'h-6 w-6 text-black',
                      weekdays: 'grid grid-cols-7 gap-2 text-center',
                      weekday: 'text-sm font-bold text-[var(--muted-foreground)]',
                      weeks: 'space-y-2',
                      week: 'grid grid-cols-7 gap-2',
                      day: 'h-11 w-11',
                      day_button:
                        'flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F1E8] text-sm font-semibold text-[#0F172A] transition hover:bg-[var(--accent)]/25',
                      selected:
                        'bg-[#DFBA62] text-[#0F172A] rounded-2xl',
                      range_start:
                        '[&>button]:bg-[#DFBA62] [&>button]:text-white',
                      range_end:
                        '[&>button]:bg-[#DFBA62] [&>button]:text-white',
                      range_middle:
                        '[&>button]:bg-[#EFE6D8] [&>button]:text-[#0F172A]',
                      today:
                        '[&>button]:bg-[#F7F1E8] [&>button]:border [&>button]:border-[#DFBA62] [&>button]:text-[#0F172A]',
                    }}
                  />

                  <div className="mt-5 flex w-full items-center justify-between gap-4 border-t border-black/5 pt-4">
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
                        className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold"
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
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-bold">
          <Activity size={18} className="text-[var(--accent)]" />
          Segmento
        </div>

        <div className={groupClass}>
          <button
            onClick={() => setSegmento('vascular')}
            className={`${pillBase} ${segmento === 'vascular' ? pillActive : pillInactive}`}
          >
            <Activity size={20} />
            Vascular
          </button>

          <button
            onClick={() => setSegmento('emagrecimento')}
            className={`${pillBase} ${segmento === 'emagrecimento' ? pillActive : pillInactive}`}
          >
            <Heart size={20} />
            Emagrecimento
          </button>

          <button
            onClick={() => setSegmento('geral')}
            className={`${pillBase} ${segmento === 'geral' ? pillActive : pillInactive}`}
          >
            <BarChart3 size={20} />
            Geral
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-bold">
          <Monitor size={18} className="text-[var(--accent)]" />
          Dispositivo
        </div>

        <div className={groupClass}>
          <button
            onClick={() => setViewMode('desktop')}
            className={`${pillBase} ${viewMode === 'desktop' ? pillActive : pillInactive}`}
          >
            <Monitor size={20} />
            iMac
          </button>

          <button
            onClick={() => setViewMode('mobile')}
            className={`${pillBase} ${viewMode === 'mobile' ? pillActive : pillInactive}`}
          >
            <Smartphone size={20} />
            iPhone
          </button>
        </div>
      </div>
    </div>
  )}
</div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-3 rounded-2xl bg-[var(--card)] px-4 py-3"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
              <span className="font-medium">
                {mounted && (resolvedTheme === 'dark' ? 'Claro' : 'Escuro')}
              </span>
            </button>

            <button
              onClick={handleRefresh}
              className="rounded-2xl bg-[var(--card)] p-3"
            >
              <RefreshCw size={18} />
            </button>

            <button
  onClick={toggleFullscreen}
  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
  className="rounded-2xl bg-[var(--card)] p-3"
>
  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
</button>

            <button className="rounded-2xl bg-[var(--card)] p-3">
              <Search size={18} />
            </button>

            <div ref={notificationRef} className="relative">
              <button
                onClick={() => {
  if (!hasNotification) return

  setShowNotifications((v) => !v)
  setHideNotifications(false)
}}
                className="relative rounded-2xl bg-[var(--card)] p-3"
              >
                <Bell size={18} />
                {hasNotification && (
  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
    1
  </span>
)}
              </button>

              {showNotifications && !hideNotifications && (
  <div className="absolute right-0 top-full mt-3 w-[360px] rounded-[28px] border border-white/10 bg-[var(--card)] p-4 shadow-2xl">
    <div className="mb-4 flex items-center justify-between">
      <div className="text-lg font-bold">Notificações</div>

      <button
        onClick={() => {
  setHideNotifications(true)
  setHasNotification(false)
}}
        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={18} />
      </button>
    </div>

    <div className="space-y-3">
      <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-500">
        Propostas fechadas acima de 70% da meta. Continue assim!
      </div>
    </div>
  </div>
)}
            </div>

            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfile((v) => !v)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--background)]"
              >
                <User2 size={18} />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-3 w-[360px] rounded-[28px] border border-white/10 bg-[var(--card)] p-5 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="text-2xl font-bold">Minha conta</div>
                    <button onClick={() => setShowProfile(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-bold text-[var(--background)]">
                      US
                    </div>

                    <div>
                      <div className="text-xl font-semibold">Usuário</div>
                      <div className="text-[var(--muted-foreground)]">—</div>
                    </div>
                  </div>

                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Senha
                  </div>

                  <div className="mb-4 flex items-center justify-between rounded-2xl bg-[var(--background)] px-4 py-3">
                    <span>{showPassword ? 'Altuus@2026#' : '••••••••'}</span>
                    <button onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <button className="mb-6 text-[var(--accent)]">
                    Alterar senha
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-rose-500"
                  >
                    <LogOut size={20} />
                    Sair
                  </button>
                </div>
              )}
             </div>
              </div>
          </div>
        </div>
      </div>
    </header>
  )
}