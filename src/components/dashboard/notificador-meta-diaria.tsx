'use client'

import { useEffect } from 'react'

const INTERVALO_MS = 3 * 60 * 1000

// Sem UI — só checa periodicamente (enquanto o painel estiver aberto) se a
// meta do dia foi batida e dispara o aviso no Slack (lógica e dedupe ficam
// no servidor, em /api/checar-meta-diaria). Fica montado uma vez no layout
// do dashboard pra rodar em qualquer tela que esteja aberta.
export function NotificadorMetaDiaria() {
  useEffect(() => {
    let ativo = true

    async function checar() {
      try {
        await fetch('/api/checar-meta-diaria', { cache: 'no-store' })
      } catch {
        // tenta de novo no próximo intervalo
      }
    }

    checar()
    const intervalo = setInterval(() => {
      if (ativo) checar()
    }, INTERVALO_MS)

    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [])

  return null
}
