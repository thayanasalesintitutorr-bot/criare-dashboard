// Cálculo de intervalo de datas a partir do período escolhido no filtro
// global do topo (Hoje/Ontem/Semana/Mês atual/Mês passado/Personalizado) —
// extraído de api/test/route.ts pra ser reaproveitado por qualquer rota que
// precise respeitar o mesmo filtro de período da barra superior.

export function parseLocalDate(value: string, end = false) {
  const [year, month, day] = value.split('-').map(Number)

  if (end) {
    return new Date(year, month - 1, day, 23, 59, 59, 999)
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date) {
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

export function getGlobalRange(periodo: string, customStart?: string, customEnd?: string) {
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
