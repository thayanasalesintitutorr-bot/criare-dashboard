'use client'

import { CalendarCheck, PartyPopper, Target } from 'lucide-react'
import { chaveData, diasDoMes } from '@/lib/dias-uteis'

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function brlCurto(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2).replace('.', ',')} mi`
  if (Math.abs(v) >= 10_000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil`
  return brl(v)
}

// "Perspectiva de venda": quanto falta pra meta do mês, quantos dias úteis
// ainda restam (descontando feriados e pontos facultativos) e quanto precisa
// ser vendido em cada um deles. Só faz sentido com o filtro "Mês atual".
export function PerspectivaMeta({
  meta,
  realizado,
  ticketMedio,
}: {
  meta: number
  realizado: number
  ticketMedio: number
}) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dias = diasDoMes(hoje)
  const hojeChave = chaveData(hoje)

  const restantes = dias.filter((d) => chaveData(d.data) >= hojeChave)
  const uteisRestantes = restantes.filter((d) => d.util)
  const feriadosRestantes = restantes.filter((d) => d.especial && !d.fimDeSemana)
  const uteisPassados = dias.filter((d) => chaveData(d.data) < hojeChave && d.util).length

  const falta = Math.max(meta - realizado, 0)
  const metaBatida = meta > 0 && realizado >= meta
  const porDia = uteisRestantes.length > 0 ? falta / uteisRestantes.length : falta
  const ticket = ticketMedio > 0 ? ticketMedio : 0
  const vendasPorDia = ticket > 0 ? porDia / ticket : 0
  const ritmo = uteisPassados > 0 ? realizado / uteisPassados : 0
  const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' })

  if (meta <= 0) return null

  return (
    <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-[#3B82F6]/10 via-[#7C6CF0]/8 to-[#A855F7]/10 px-4 py-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Target size={20} className="text-[var(--accent)]" />
          <h4 className="text-[16px] font-extrabold uppercase tracking-[0.08em] text-[var(--foreground)]">
            Perspectiva de venda · meta de {nomeMes}
          </h4>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[13px] font-semibold text-[var(--muted-foreground)]">
          {uteisRestantes.length} {uteisRestantes.length === 1 ? 'dia útil restante' : 'dias úteis restantes'}
          {feriadosRestantes.length > 0 &&
            ` · ${feriadosRestantes.length} ${feriadosRestantes.length === 1 ? 'feriado' : 'feriados'}`}
        </span>
      </div>

      {metaBatida ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--success)]/12 px-4 py-3 text-[var(--success)]">
          <PartyPopper size={26} />
          <p className="text-[20px] font-extrabold">
            Meta batida! Já passou {brlCurto(realizado - meta)} da meta de {brlCurto(meta)}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 @xl:grid-cols-2 @4xl:grid-cols-4">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white/[0.05] px-3.5 py-2.5">
              <p className="truncate text-[12px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Falta para a meta</p>
              <p className="mt-1 break-words text-[19px] @sm:text-[22px] @lg:text-[26px] font-black leading-tight text-[var(--danger)]">{brlCurto(falta)}</p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white/[0.05] px-3.5 py-2.5">
              <p className="truncate text-[12px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Precisa por dia útil</p>
              <p className="mt-1 break-words text-[19px] @sm:text-[22px] @lg:text-[26px] font-black leading-tight text-[var(--foreground)]">{brlCurto(porDia)}</p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white/[0.05] px-3.5 py-2.5">
              <p className="truncate text-[12px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Vendas por dia</p>
              <p className="mt-1 break-words text-[19px] @sm:text-[22px] @lg:text-[26px] font-black leading-tight text-[var(--foreground)]">
                {ticket > 0 ? `≈ ${Math.max(Math.ceil(vendasPorDia), 1)}` : '—'}
              </p>
              {ticket > 0 && (
                <p className="mt-1 truncate text-[12px] font-semibold text-[var(--muted-foreground)]">no ticket de {brlCurto(ticket)}</p>
              )}
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white/[0.05] px-3.5 py-2.5">
              <p className="truncate text-[12px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Ritmo atual</p>
              <p className="mt-1 break-words text-[19px] @sm:text-[22px] @lg:text-[26px] font-black leading-tight text-[var(--foreground)]">
                {uteisPassados > 0 ? `${brlCurto(ritmo)}/dia` : '—'}
              </p>
              {uteisPassados > 0 && (
                <p className="mt-1 truncate text-[12px] font-semibold" style={{ color: ritmo >= porDia ? 'var(--success)' : 'var(--danger)' }}>
                  {ritmo >= porDia ? 'acima do necessário' : 'abaixo do necessário'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            <CalendarCheck size={16} />
            O que fazer em cada dia
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 @2xl:grid-cols-5 @5xl:grid-cols-7">
            {restantes
              .filter((d) => !d.fimDeSemana)
              .map((d) => {
                const chave = chaveData(d.data)
                const ehHoje = chave === hojeChave
                const rotulo = `${SEMANA[d.data.getDay()]} ${String(d.data.getDate()).padStart(2, '0')}/${String(d.data.getMonth() + 1).padStart(2, '0')}`

                if (!d.util) {
                  return (
                    <div
                      key={chave}
                      title={d.especial?.nome}
                      className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 opacity-80"
                    >
                      <p className="text-[12px] font-bold uppercase text-[var(--muted-foreground)]">{rotulo}</p>
                      <p className="mt-0.5 truncate text-[13px] font-extrabold text-[var(--warning)]">
                        {d.especial?.tipo === 'facultativo' ? 'Ponto facultativo' : 'Feriado'}
                      </p>
                      <p className="truncate text-[11.5px] font-medium text-[var(--muted-foreground)]">{d.especial?.nome}</p>
                    </div>
                  )
                }

                return (
                  <div
                    key={chave}
                    className={`min-w-0 overflow-hidden rounded-xl px-3 py-2 ${
                      ehHoje ? 'border border-[var(--accent)]/60 bg-[var(--accent)]/15' : 'border border-white/10 bg-white/[0.05]'
                    }`}
                  >
                    <p className="flex items-center justify-between gap-1 text-[12px] font-bold uppercase text-[var(--muted-foreground)]">
                      <span className="truncate">{rotulo}</span>
                      {ehHoje && <span className="shrink-0 rounded bg-[var(--accent)] px-1.5 text-[10px] text-white">HOJE</span>}
                    </p>
                    <p className="mt-0.5 break-words text-[16px] @sm:text-[19px] font-black leading-tight text-[var(--foreground)]">{brlCurto(porDia)}</p>
                    {ticket > 0 && (
                      <p className="truncate text-[11.5px] font-semibold text-[var(--muted-foreground)]">
                        ≈ {Math.max(Math.ceil(vendasPorDia), 1)} venda{Math.ceil(vendasPorDia) > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>

          {uteisRestantes.length === 0 && (
            <p className="mt-2 text-[14px] font-semibold text-[var(--danger)]">
              Não restam dias úteis neste mês. Faltaram {brlCurto(falta)} para a meta.
            </p>
          )}
        </>
      )}
    </div>
  )
}
