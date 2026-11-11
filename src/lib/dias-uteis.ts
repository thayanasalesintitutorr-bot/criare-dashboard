// Feriados nacionais e pontos facultativos do Brasil + feriado do DF (a
// clínica fica em Brasília), pra calcular os dias úteis que ainda restam no
// mês. Os feriados móveis saem da data da Páscoa, então vale pra qualquer ano.

export type DiaEspecial = {
  data: Date
  nome: string
  tipo: 'feriado' | 'facultativo'
}

function dia(ano: number, mes: number, d: number) {
  return new Date(ano, mes - 1, d)
}

function somarDias(data: Date, n: number) {
  const r = new Date(data)
  r.setDate(r.getDate() + n)
  return r
}

// Algoritmo de Meeus/Jones/Butcher (calendário gregoriano)
function pascoa(ano: number) {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const d2 = ((h + l - 7 * m + 114) % 31) + 1
  return dia(ano, mes, d2)
}

export function feriadosDoAno(ano: number): DiaEspecial[] {
  const p = pascoa(ano)
  const lista: DiaEspecial[] = [
    { data: dia(ano, 1, 1), nome: 'Confraternização Universal', tipo: 'feriado' },
    { data: somarDias(p, -48), nome: 'Carnaval', tipo: 'facultativo' },
    { data: somarDias(p, -47), nome: 'Carnaval', tipo: 'facultativo' },
    { data: somarDias(p, -46), nome: 'Quarta-feira de Cinzas', tipo: 'facultativo' },
    { data: somarDias(p, -2), nome: 'Sexta-feira Santa', tipo: 'feriado' },
    { data: dia(ano, 4, 21), nome: 'Tiradentes / Dia de Brasília', tipo: 'feriado' },
    { data: dia(ano, 5, 1), nome: 'Dia do Trabalho', tipo: 'feriado' },
    { data: somarDias(p, 60), nome: 'Corpus Christi', tipo: 'facultativo' },
    { data: dia(ano, 9, 7), nome: 'Independência do Brasil', tipo: 'feriado' },
    { data: dia(ano, 10, 12), nome: 'Nossa Senhora Aparecida', tipo: 'feriado' },
    { data: dia(ano, 10, 28), nome: 'Dia do Servidor Público', tipo: 'facultativo' },
    { data: dia(ano, 11, 2), nome: 'Finados', tipo: 'feriado' },
    { data: dia(ano, 11, 15), nome: 'Proclamação da República', tipo: 'feriado' },
    { data: dia(ano, 11, 20), nome: 'Consciência Negra', tipo: 'feriado' },
    // Dia do Evangélico (30/11, feriado municipal do DF) não é observado pela
    // clínica — abre normal nesse dia (confirmado na reunião de 06/11/2026).
    { data: dia(ano, 12, 24), nome: 'Véspera de Natal', tipo: 'facultativo' },
    { data: dia(ano, 12, 25), nome: 'Natal', tipo: 'feriado' },
    { data: dia(ano, 12, 31), nome: 'Véspera de Ano Novo', tipo: 'facultativo' },
  ]
  return lista
}

export function chaveData(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type DiaDoMes = {
  data: Date
  fimDeSemana: boolean
  especial?: DiaEspecial
  util: boolean
}

// Todos os dias do mês de `ref`, já marcados como útil / feriado / fim de semana
export function diasDoMes(ref: Date): DiaDoMes[] {
  const ano = ref.getFullYear()
  const mes = ref.getMonth()
  const especiais = new Map(feriadosDoAno(ano).map((f) => [chaveData(f.data), f]))
  const total = new Date(ano, mes + 1, 0).getDate()
  const dias: DiaDoMes[] = []

  for (let d = 1; d <= total; d++) {
    const data = new Date(ano, mes, d)
    const dow = data.getDay()
    const fimDeSemana = dow === 0 || dow === 6
    const especial = especiais.get(chaveData(data))
    dias.push({ data, fimDeSemana, especial, util: !fimDeSemana && !especial })
  }

  return dias
}
