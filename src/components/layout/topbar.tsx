'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sun,
  User2,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ZoomIn,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useFilters } from '../../store/use-filters'
import { useAuth } from '../../store/use-auth'
import { useSessionRole } from '../../store/use-session-role'
import { useZoom, NIVEIS_ZOOM } from '../../store/use-zoom'
import { useScaledHeight } from '../../store/use-scaled-height'
import { useRouter, usePathname } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { ptBR } from 'date-fns/locale'

const NOTIF_SEEN_KEY = 'criare-notif-propostas-seen-percent'
const NOTIF_SEEN_PROTOCOLOS_KEY = 'criare-notif-protocolos-seen-count'
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

const OPCOES_PERIODO = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: 'ontem', label: 'Ontem' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes-atual', label: 'Mês atual' },
  { valor: 'mes-passado', label: 'Mês passado' },
] as const

const OPCOES_SEGMENTO = [
  { valor: 'geral', label: 'Geral', icone: BarChart3 },
  { valor: 'vascular', label: 'Vascular', icone: Activity },
  { valor: 'emagrecimento', label: 'Emagrecimento', icone: Heart },
] as const

const rotuloFiltro =
  'mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]'
const trilhoFiltro =
  'relative flex flex-wrap items-center gap-1 rounded-2xl border border-[color:var(--border)] bg-[var(--metric-card)]/60 p-1.5'

// Opção de filtro com "pílula" de destaque que desliza (layoutId) até a
// opção escolhida, em vez de só trocar a cor — dá a sensação de controle
// físico e deixa claro o que está selecionado.
function OpcaoFiltro({
  ativo,
  layoutId,
  onClick,
  icon,
  children,
}: {
  ativo: boolean
  layoutId: string
  onClick: () => void
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -1 }}
      className={`relative inline-flex items-center whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
        ativo ? 'text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
      }`}
    >
      {ativo && (
        <motion.span
          layoutId={layoutId}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#7C6CF0] to-[#A855F7] shadow-[0_6px_18px_rgba(99,102,241,0.45)]"
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {children}
      </span>
    </motion.button>
  )
}

export function Topbar({ title, statusIndicator }: { title: string; statusIndicator?: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const {
  periodo,
  setPeriodo,
  tipoData,
  segmento,
  setSegmento,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  comparar,
  setComparar,
  compararInicio,
  setCompararInicio,
  compararFim,
  setCompararFim,
} = useFilters()

  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isProtocolosPage = pathname === '/conversas'
  const { role: sessao, fetchRole } = useSessionRole()
  const { indice: zoomIndice, aumentar: zoomAumentar, diminuir: zoomDiminuir, resetar: zoomResetar } = useZoom()
  const zoomEscala = NIVEIS_ZOOM[zoomIndice]

  const [mounted, setMounted] = useState(false)
  // Com zoom alto (acima de 130%) o filtro ocupa espaço demais e some; fica
  // só uma dica discreta que aparece quando a pessoa rola pra cima.
  const zoomAlto = zoomEscala > 1.3
  const [filtroAbertoEm, setFiltroAbertoEm] = useState<number | null>(null)
  const [dicaFiltro, setDicaFiltro] = useState(false)
  if (!zoomAlto && filtroAbertoEm !== null) setFiltroAbertoEm(null)
  const filtroVisivel = !zoomAlto || filtroAbertoEm !== null
  const { ref: filtroRef, altura: filtroAltura } = useScaledHeight(zoomEscala, filtroVisivel)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCompararCalendar, setShowCompararCalendar] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarPopupRef = useRef<HTMLDivElement>(null)
  const compararCalendarRef = useRef<HTMLDivElement>(null)
  const compararCalendarPopupRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const notificationCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [propostasPercent, setPropostasPercent] = useState<number | null>(null)
  const [lastSeenPercent, setLastSeenPercent] = useState<number | null>(null)
  const [vendasProtocoloPendentes, setVendasProtocoloPendentes] = useState(0)
  const [lastSeenVendasProtocolo, setLastSeenVendasProtocolo] = useState(0)

  useEffect(() => {
    setMounted(true)

    const stored = localStorage.getItem(NOTIF_SEEN_KEY)
    if (stored) setLastSeenPercent(Number(stored))

    const storedVendas = localStorage.getItem(NOTIF_SEEN_PROTOCOLOS_KEY)
    if (storedVendas) setLastSeenVendasProtocolo(Number(storedVendas))

    fetchRole()
  }, [fetchRole])

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
    let cancelled = false

    async function loadVendasProtocolo() {
      try {
        const res = await fetch('/api/pacientes-protocolo/novas-vendas', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (cancelled || !json.ok) return
        setVendasProtocoloPendentes(Array.isArray(json.vendas) ? json.vendas.length : 0)
      } catch {
        // silencioso: exige a segunda senha da página de Protocolos desbloqueada
      }
    }

    loadVendasProtocolo()
    const interval = setInterval(loadVendasProtocolo, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (notificationCloseTimer.current) clearTimeout(notificationCloseTimer.current)
    }
  }, [])

  const notifications = [
    propostasPercent !== null && propostasPercent >= 70
      ? {
          id: 'propostas',
          texto: `Propostas fechadas acima de ${propostasPercent}% da meta. Continue assim!`,
          tone: 'success' as const,
          vista: propostasPercent === lastSeenPercent,
        }
      : null,
    vendasProtocoloPendentes > 0
      ? {
          id: 'protocolos',
          texto: `${vendasProtocoloPendentes} venda(s) de protocolo aguardando acompanhamento em Protocolos.`,
          tone: 'accent' as const,
          vista: vendasProtocoloPendentes === lastSeenVendasProtocolo,
        }
      : null,
  ].filter((n): n is NonNullable<typeof n> => n !== null)

  const hasNotification = notifications.some((n) => !n.vista)

  function handleOpenNotifications() {
    if (notifications.length === 0) return

    setShowNotifications(true)

    if (propostasPercent !== null) {
      localStorage.setItem(NOTIF_SEEN_KEY, String(propostasPercent))
      setLastSeenPercent(propostasPercent)
    }
    localStorage.setItem(NOTIF_SEEN_PROTOCOLOS_KEY, String(vendasProtocoloPendentes))
    setLastSeenVendasProtocolo(vendasProtocoloPendentes)

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
    if (!zoomAlto || filtroAbertoEm !== null) return

    let ultimo = window.scrollY
    let timer: ReturnType<typeof setTimeout> | null = null

    function aoRolar() {
      const y = window.scrollY
      const subindo = y < ultimo - 2
      const descendo = y > ultimo + 2
      ultimo = y

      if (y < 24) {
        if (timer) clearTimeout(timer)
        setDicaFiltro(true)
        return
      }
      if (subindo) {
        if (timer) clearTimeout(timer)
        setDicaFiltro(true)
        timer = setTimeout(() => setDicaFiltro(false), 4500)
      } else if (descendo) {
        if (timer) clearTimeout(timer)
        setDicaFiltro(false)
      }
    }

    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.removeEventListener('scroll', aoRolar)
      if (timer) clearTimeout(timer)
    }
  }, [zoomAlto, filtroAbertoEm])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node

      const dentroDoGatilhoCalendario = calendarRef.current?.contains(target)
      const dentroDoPopupCalendario = calendarPopupRef.current?.contains(target)
      if (!dentroDoGatilhoCalendario && !dentroDoPopupCalendario) {
        setShowCalendar(false)
      }

      const dentroDoGatilhoComparar = compararCalendarRef.current?.contains(target)
      const dentroDoPopupComparar = compararCalendarPopupRef.current?.contains(target)
      if (!dentroDoGatilhoComparar && !dentroDoPopupComparar) {
        setShowCompararCalendar(false)
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfile(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false)
      }

      if (zoomRef.current && !zoomRef.current.contains(target)) {
        setShowZoom(false)
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

  async function handleLogout() {
    logout()

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // segue o logout mesmo se a chamada falhar — o cookie expira sozinho
    }

    localStorage.removeItem('access_token')
    router.push('/login')
  }


function parseLocalDate(dateString?: string) {
  if (!dateString) return undefined

  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
  return (
    <header className="z-30 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex flex-col gap-3 px-4 pt-4 pb-1 sm:px-6 md:px-8">
        <div className="flex flex-col items-stretch justify-between gap-3 tablet:flex-row tablet:items-start tablet:gap-6">

          <div className="flex-1 space-y-4">
            <motion.p
              key={`eyebrow-${title}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--muted-foreground)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7] shadow-[0_0_10px_#A855F7]" />
              Painel Criare
            </motion.p>
            <div className="relative -mt-1">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-6 top-1/2 h-24 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.28),transparent_70%)]"
                style={{ animation: 'halo-pulse 5s ease-in-out infinite' }}
              />
              <motion.h1
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative inline-block bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text pb-1 text-3xl font-black tracking-[-0.05em] text-transparent mobile-h:text-4xl laptop:text-5xl"
                style={{ backgroundSize: '200% 100%', animation: 'text-shimmer 6s ease-in-out infinite' }}
              >
                {title}
              </motion.h1>
              <motion.span
                key={`linha-${title}`}
                aria-hidden
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                className="mt-1 block h-[3px] rounded-full bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#EC4899]"
              />
            </div>
          </div>
<div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-3 rounded-[18px] bg-[var(--card)] px-4 py-3 transition-colors duration-200 hover:bg-[var(--metric-card)]"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
              <span className="hidden font-medium mobile-h:inline">
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
  className="hidden rounded-[18px] bg-[var(--card)] p-3 transition-colors duration-200 hover:bg-[var(--metric-card)] tablet:inline-flex"
>
  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
</button>

            <div ref={zoomRef} className="relative hidden tablet:block">
              <button
                onClick={() => setShowZoom((v) => !v)}
                title="Zoom"
                className={`inline-flex items-center gap-2 rounded-[18px] p-3 transition-colors duration-200 ${
                  zoomIndice > 0
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'bg-[var(--card)] hover:bg-[var(--metric-card)]'
                }`}
              >
                <ZoomIn size={18} />
                {zoomIndice > 0 && (
                  <span className="text-sm font-bold">{Math.round(NIVEIS_ZOOM[zoomIndice] * 100)}%</span>
                )}
              </button>

              {showZoom && (
                <div className="absolute right-0 top-full z-50 mt-3 flex items-center gap-1 rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl">
                  <button
                    onClick={zoomDiminuir}
                    disabled={zoomIndice === 0}
                    title="Diminuir"
                    className="rounded-xl p-2.5 transition-colors hover:bg-[var(--metric-card)] disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-14 text-center text-sm font-bold">
                    {Math.round(NIVEIS_ZOOM[zoomIndice] * 100)}%
                  </span>

                  <button
                    onClick={zoomAumentar}
                    disabled={zoomIndice === NIVEIS_ZOOM.length - 1}
                    title="Aumentar"
                    className="rounded-xl p-2.5 transition-colors hover:bg-[var(--metric-card)] disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>

                  <div className="mx-1 h-6 w-px bg-[var(--border)]" />

                  <button
                    onClick={zoomResetar}
                    disabled={zoomIndice === 0}
                    title="Redefinir zoom"
                    className="rounded-xl p-2.5 transition-colors hover:bg-[var(--metric-card)] disabled:pointer-events-none disabled:opacity-30"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>

            <button className="hidden rounded-[18px] bg-[var(--card)] p-3 transition-colors duration-200 hover:bg-[var(--metric-card)] mobile-h:inline-flex">
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
    {notifications.filter((n) => !n.vista).length}
  </span>
)}
              </button>

              {showNotifications && notifications.length > 0 && (
  <div className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] max-w-[360px] rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
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
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`rounded-[18px] p-4 ${
            n.tone === 'success'
              ? 'bg-[var(--success)]/10 text-[var(--success)]'
              : 'bg-[var(--accent)]/10 text-[var(--accent)]'
          }`}
        >
          {n.texto}
        </div>
      ))}
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
                <div className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] max-w-[360px] rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
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
           

<div className="flex justify-end px-1">
  {statusIndicator}
</div>

{!isProtocolosPage && filtroVisivel && (
<div
  style={
    zoomEscala === 1 || !filtroAltura
      ? undefined
      : { height: filtroAltura }
  }
>
<div
  ref={filtroRef}
  className="@container rounded-[18px] bg-[var(--card)] px-3 py-3 sm:px-5 shadow-sm"
  style={
    zoomEscala === 1
      ? undefined
      : {
          width: `${100 / zoomEscala}%`,
          transform: `scale(${zoomEscala})`,
          transformOrigin: 'top left',
        }
  }
>
    <div className="relative flex flex-wrap items-start gap-x-8 gap-y-4">
      {zoomAlto && (
        <button
          type="button"
          onClick={() => setFiltroAbertoEm(null)}
          className="absolute right-0 top-0 flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <X size={12} /> Ocultar filtro
        </button>
      )}
      <div className="min-w-0">
        <p className={rotuloFiltro}>
          <CalendarDays size={14} className="text-[var(--accent)]" />
          Período
        </p>
        <div className={trilhoFiltro}>
          {OPCOES_PERIODO.map((o) => (
            <OpcaoFiltro
              key={o.valor}
              ativo={periodo === o.valor}
              layoutId="filtro-periodo"
              onClick={() => setPeriodo(o.valor)}
            >
              {o.label}
            </OpcaoFiltro>
          ))}

          <div ref={calendarRef} className="relative">
            <OpcaoFiltro
              ativo={periodo === 'personalizado'}
              layoutId="filtro-periodo"
              onClick={() => setShowCalendar((v) => !v)}
              icon={<CalendarDays size={15} />}
            >
              Personalizado
            </OpcaoFiltro>

            {showCalendar && createPortal(
              <>
              <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setShowCalendar(false)}
              />
              <div ref={calendarPopupRef} className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2.5rem)] w-[360px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] border border-[var(--border)] bg-[var(--card)] shadow-2xl">
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
              </>,
              document.body
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className={rotuloFiltro}>
          <Activity size={14} className="text-[var(--accent)]" />
          Segmento
        </p>
        <div className={trilhoFiltro}>
          {OPCOES_SEGMENTO.map((o) => {
            const Icone = o.icone
            return (
              <OpcaoFiltro
                key={o.valor}
                ativo={segmento === o.valor}
                layoutId="filtro-segmento"
                onClick={() => setSegmento(o.valor)}
                icon={<Icone size={15} />}
              >
                {o.label}
              </OpcaoFiltro>
            )
          })}
        </div>
      </div>

      <div className="min-w-0">
        <p className={rotuloFiltro}>
          <BarChart3 size={14} className="text-[var(--accent)]" />
          Comparação
        </p>
        <div className={`${trilhoFiltro} gap-2.5 pr-3`}>
          <motion.button
            type="button"
            role="switch"
            aria-checked={comparar}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (comparar) {
                setComparar(false)
              } else {
                setComparar(true)
                setShowCompararCalendar(true)
              }
            }}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-semibold text-[var(--foreground)]"
          >
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                comparar ? 'bg-gradient-to-r from-[#3B82F6] to-[#A855F7] shadow-[0_0_14px_rgba(99,102,241,0.55)]' : 'bg-[var(--progress-bg)]'
              }`}
            >
              <motion.span
                className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
                animate={{ x: comparar ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </span>
            {comparar ? 'Comparando' : 'Comparar período'}
          </motion.button>

          <AnimatePresence initial={false}>
            {comparar && (
              <motion.div
                key="chip-comparar"
                ref={compararCalendarRef}
                initial={{ opacity: 0, x: -8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => setShowCompararCalendar(true)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]/20"
                >
                  <CalendarDays size={14} className="text-[var(--accent)]" />
                  {compararInicio && compararFim
                    ? `${parseLocalDate(compararInicio)?.toLocaleDateString('pt-BR')} → ${parseLocalDate(compararFim)?.toLocaleDateString('pt-BR')}`
                    : 'Período anterior'}
                </button>

                {showCompararCalendar && createPortal(
                  <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setShowCompararCalendar(false)}
                  />
                  <div ref={compararCalendarPopupRef} className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2.5rem)] w-[360px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] border border-[var(--border)] bg-[var(--card)] shadow-2xl">
                    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]">
                        <CalendarDays size={16} />
                      </div>

                      <div>
                        <p className="text-lg font-bold">Período de comparação</p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Escolha a data inicial e final para comparar
                        </p>
                      </div>
                    </div>

                    <div className="relative flex flex-col items-center px-4 py-3">
                      <DayPicker
                        locale={ptBR}
                        mode="range"
                        selected={{
                          from: parseLocalDate(compararInicio),
                          to: parseLocalDate(compararFim),
                        }}
                        onSelect={(range) => {
                          if (range?.from) {
                            const ano = range.from.getFullYear()
                            const mes = String(range.from.getMonth() + 1).padStart(2, '0')
                            const dia = String(range.from.getDate()).padStart(2, '0')
                            setCompararInicio(`${ano}-${mes}-${dia}`)
                          }

                          if (range?.to) {
                            const ano = range.to.getFullYear()
                            const mes = String(range.to.getMonth() + 1).padStart(2, '0')
                            const dia = String(range.to.getDate()).padStart(2, '0')
                            setCompararFim(`${ano}-${mes}-${dia}`)
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
                          selected: 'bg-[var(--accent)] text-white rounded-2xl',
                          range_start: '[&>button]:bg-[var(--accent)] [&>button]:text-white',
                          range_end: '[&>button]:bg-[var(--accent)] [&>button]:text-white',
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
                            {compararInicio && compararFim
                              ? `${parseLocalDate(compararInicio)?.toLocaleDateString('pt-BR')} até ${parseLocalDate(compararFim)?.toLocaleDateString('pt-BR')}`
                              : 'Selecione início e fim'}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-3">
                          <button
                            onClick={() => {
                              setCompararInicio('')
                              setCompararFim('')
                            }}
                            className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold"
                          >
                            Limpar
                          </button>

                          <button
                            onClick={() => {
                              setShowCompararCalendar(false)
                            }}
                            className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--background)]"
                          >
                            Aplicar período
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  </>,
                  document.body
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
</div>
</div>
)}
          </div>

      <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center">
        <AnimatePresence>
          {zoomAlto && filtroAbertoEm === null && dicaFiltro && !isProtocolosPage && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              onClick={() => setFiltroAbertoEm(zoomEscala)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-[var(--card)]/80 px-3.5 py-1.5 text-[12px] font-medium text-[var(--muted-foreground)] shadow-lg backdrop-blur-md transition-colors hover:text-[var(--foreground)]"
            >
              <ChevronDown size={13} className="animate-bounce" />
              clique para visualizar o filtro
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}