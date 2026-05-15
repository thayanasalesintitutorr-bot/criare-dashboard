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
  } = useFilters()

  const { logout } = useAuth()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCalendarInicio, setShowCalendarInicio] = useState(false)
  const [showCalendarFim, setShowCalendarFim] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        setShowCalendarInicio(false)
        setShowCalendarFim(false)
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

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const groupClass = 'flex flex-wrap items-center gap-1.5 rounded-[20px] bg-[var(--card)] p-2'
  const pillBase =
    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-all whitespace-nowrap'
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

            <div className="flex flex-wrap items-center gap-3">
              <div className={groupClass}>
                <button
                  onClick={() => setTipoData('criado')}
                  className={`${pillBase} ${tipoData === 'criado' ? pillActive : pillInactive}`}
                >
                  <Database size={16} />
                  Criado
                </button>

                <button
                  onClick={() => setTipoData('fechado')}
                  className={`${pillBase} ${tipoData === 'fechado' ? pillActive : pillInactive}`}
                >
                  <Database size={16} />
                  Fechado
                </button>
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
                    <CalendarDays size={16} />
                    Personalizado
                  </button>

                  {showCalendar && (
                    <div className="absolute left-0 top-full mt-3 min-w-[320px] rounded-2xl border border-white/10 bg-[var(--card)] p-4 shadow-2xl">
                      <div className="grid gap-3">
                        <div>
                          <label className="mb-1 block text-sm text-[var(--muted-foreground)]">
                            Data inicial
                          </label>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCalendarInicio((v) => !v)
                                setShowCalendarFim(false)
                              }}
                              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-transparent px-4 py-3 text-left"
                            >
                              <span>
                                {dataInicio ? parseLocalDate(dataInicio)?.toLocaleDateString('pt-BR') : 'dd/mm/aaaa'}
                              </span>
                              <CalendarDays size={18} />
                            </button>

                            {showCalendarInicio && (
                              <div
  className="rounded-2xl border border-white/10 bg-[var(--background)] p-3"
  style={
    {
      '--rdp-accent-color': 'var(--accent)',
      '--rdp-background-color': 'transparent',
    } as React.CSSProperties
  }
>
                                <DayPicker
  locale={ptBR}
  mode="single"
  selected={parseLocalDate(dataInicio)}
  onSelect={(date: Date | undefined) => {
    if (date) {
      const ano = date.getFullYear()
      const mes = String(date.getMonth() + 1).padStart(2, '0')
      const dia = String(date.getDate()).padStart(2, '0')
      setDataInicio(`${ano}-${mes}-${dia}`)
      setShowCalendarInicio(false)
    }
  }}
  formatters={{
    formatCaption: (date) =>
      date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
  }}
  className="p-1 text-xs"
  classNames={{
    month: 'space-y-3',
    caption: 'flex items-center justify-between px-2 text-[13px] font-semibold capitalize',
    nav: 'flex items-center gap-1',
    button_previous:
      'h-7 w-7 rounded-md flex items-center justify-center hover:bg-[var(--accent)]/10 transition',
    button_next:
      'h-7 w-7 rounded-md flex items-center justify-center hover:bg-[var(--accent)]/10 transition',
    chevron: 'h-5 w-5 text-[var(--accent)]',
    weekdays: 'grid grid-cols-7',
    weekday: 'text-center text-[11px] font-medium text-[var(--muted-foreground)]',
    weeks: 'space-y-1',
    week: 'grid grid-cols-7 place-items-center',
    day_button:
  'flex h-10 w-10 items-center justify-center rounded-full text-[13px] leading-none transition hover:bg-[var(--muted)]',
selected:
  'flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--background)] shadow-sm',
today:
  'flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)]',
    outside: 'text-gray-400',
  }}
/>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-[var(--muted-foreground)]">
                            Data final
                          </label>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCalendarFim((v) => !v)
                                setShowCalendarInicio(false)
                              }}
                              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-transparent px-4 py-3 text-left"
                            >
                              <span>
                                {dataFim ? parseLocalDate(dataFim)?.toLocaleDateString('pt-BR') : 'dd/mm/aaaa'}
                              </span>
                              <CalendarDays size={18} />
                            </button>

                            {showCalendarFim && (
                              <div
  className="rounded-2xl border border-white/10 bg-[var(--background)] p-3"
  style={
    {
      '--rdp-accent-color': 'var(--accent)',
      '--rdp-background-color': 'transparent',
    } as React.CSSProperties
  }
>
                                <DayPicker
  locale={ptBR}
  mode="single"
  selected={parseLocalDate(dataFim)}
  onSelect={(date: Date | undefined) => {
    if (date) {
      const ano = date.getFullYear()
      const mes = String(date.getMonth() + 1).padStart(2, '0')
      const dia = String(date.getDate()).padStart(2, '0')
      setDataFim(`${ano}-${mes}-${dia}`)
      setShowCalendarFim(false)
    }
  }}
  formatters={{
    formatCaption: (date) =>
      date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
  }}
  className="p-1 text-xs"
  classNames={{
    month: 'space-y-3',
    caption: 'flex items-center justify-between px-2 text-[13px] font-semibold capitalize',
    nav: 'flex items-center gap-1',
    button_previous:
      'h-7 w-7 rounded-md flex items-center justify-center hover:bg-[var(--accent)]/10 transition',
    button_next:
      'h-7 w-7 rounded-md flex items-center justify-center hover:bg-[var(--accent)]/10 transition',
    chevron: 'h-5 w-5 text-[var(--accent)]',
    weekdays: 'grid grid-cols-7',
    weekday: 'text-center text-[11px] font-medium text-[var(--muted-foreground)]',
    weeks: 'space-y-1',
    week: 'grid grid-cols-7 place-items-center',
    day_button:
  'flex h-10 w-10 items-center justify-center rounded-full text-[13px] leading-none transition hover:bg-[var(--muted)]',
selected:
  'flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--background)] shadow-sm',
today:
  'flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)]',
    outside: 'text-gray-400',
  }}
/>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setPeriodo('personalizado')
                            setShowCalendar(false)
                            setShowCalendarInicio(false)
                            setShowCalendarFim(false)
                          }}
                          className="mt-2 rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-[var(--background)]"
                        >
                          Aplicar período
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={groupClass}>
                <button
                  onClick={() => setSegmento('vascular')}
                  className={`${pillBase} ${segmento === 'vascular' ? pillActive : pillInactive}`}
                >
                  <Activity size={16} />
                  Vascular
                </button>

                <button
                  onClick={() => setSegmento('emagrecimento')}
                  className={`${pillBase} ${segmento === 'emagrecimento' ? pillActive : pillInactive}`}
                >
                  <Heart size={16} />
                  Emagrecimento
                </button>

                <button
                  onClick={() => setSegmento('geral')}
                  className={`${pillBase} ${segmento === 'geral' ? pillActive : pillInactive}`}
                >
                  <BarChart3 size={16} />
                  Geral
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--card)] px-4 py-3"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}
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

            <button className="rounded-2xl bg-[var(--card)] p-3">
              <Search size={18} />
            </button>

            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative rounded-2xl bg-[var(--card)] p-3"
              >
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  3
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-[360px] rounded-[28px] border border-white/10 bg-[var(--card)] p-4 shadow-2xl">
                  <div className="mb-4 text-lg font-bold">Notificações</div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-500">
                      Bem-vindo de volta, usuário! Vamos acompanhar seus resultados.
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-4 text-amber-500">
                      Ticket médio abaixo da meta de R$ 2.830. Atenção ao mix de serviços.
                    </div>

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
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button className="mb-6 text-[var(--accent)]">
                    Alterar senha
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-rose-500"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}