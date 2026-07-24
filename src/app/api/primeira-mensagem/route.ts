export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function parseLocalDate(value: string, end = false) {
  const [year, month, day] = value.split('-').map(Number)

  if (end) {
    return new Date(year, month - 1, day, 23, 59, 59, 999)
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function getWeekRangeSaturdayToFriday(baseDate: Date) {
  const current = startOfDay(baseDate)
  const day = current.getDay()
  const diffToSaturday = day === 6 ? 0 : day + 1

  const start = new Date(current)
  start.setDate(current.getDate() - diffToSaturday)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return { start: startOfDay(start), end: endOfDay(end) }
}

function getMonthRange(date: Date) {
  return {
    start: startOfDay(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  }
}

function getPreviousMonthRange(date: Date) {
  return {
    start: startOfDay(new Date(date.getFullYear(), date.getMonth() - 1, 1)),
    end: endOfDay(new Date(date.getFullYear(), date.getMonth(), 0)),
  }
}

function getGlobalRange(periodo: string, customStart?: string, customEnd?: string) {
  const now = new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo',
    })
  )

  switch (periodo) {
    case 'hoje':
      return { start: startOfDay(now), end: endOfDay(now) }

    case 'ontem': {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      return { start: startOfDay(y), end: endOfDay(y) }
    }

    case 'semana':
      return getWeekRangeSaturdayToFriday(now)

    case 'mes-atual':
      return getMonthRange(now)

    case 'mes-passado':
      return getPreviousMonthRange(now)

    case 'personalizado': {
      if (customStart && customEnd) {
        return {
          start: parseLocalDate(customStart),
          end: parseLocalDate(customEnd, true),
        }
      }
      return { start: startOfDay(now), end: endOfDay(now) }
    }

    default:
      return { start: startOfDay(now), end: endOfDay(now) }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const periodo = searchParams.get('periodo') || 'mes-atual'
    const customStart = searchParams.get('inicio') || ''
    const customEnd = searchParams.get('fim') || ''

    const range = getGlobalRange(periodo, customStart, customEnd)

    const { data, error } = await supabaseAdmin.rpc('leads_primeira_mensagem', {
      p_inicio: range.start.toISOString(),
      p_fim: range.end.toISOString(),
    })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      total: data?.total ?? 0,
      porCampanha: data?.porCampanha ?? [],
    })
  } catch (err) {
    console.error('[api/primeira-mensagem]', err)

    return NextResponse.json(
      { ok: false, error: 'Erro ao carregar leads de primeira mensagem' },
      { status: 500 },
    )
  }
}
