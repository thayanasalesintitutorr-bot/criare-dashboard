// Envia DM via bot do Slack (app SARA) pra uma lista fixa de pessoas, em vez
// de um Incoming Webhook num canal — usa o mesmo mecanismo que a SARA já usa
// nos fluxos do n8n (chat.postMessage com o ID do usuário como "channel").
const DESTINATARIOS_PADRAO = [
  { id: 'U06E67Z9HHT', nome: 'Thayana' },
  { id: 'U04P493PCAJ', nome: 'Dr. Rodolpho' },
]

function destinatarios() {
  if (!process.env.SLACK_DM_USER_IDS) return DESTINATARIOS_PADRAO

  return process.env.SLACK_DM_USER_IDS.split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({ id, nome: DESTINATARIOS_PADRAO.find((d) => d.id === id)?.nome || '' }))
}

export function saudacao(hoje: Date = new Date()) {
  const hora = hoje.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export type ResultadoEnvioSlack = { destinatario: string; ok: boolean; error?: string }

// `construirTexto` recebe o primeiro nome de cada destinatário, pra cada DM
// sair personalizada (ex: "Boa tarde, Thayana! ..."). A API do Slack responde
// HTTP 200 mesmo quando falha (ex: sem permissão pra essa DM) — por isso
// sempre lemos o corpo e devolvemos o resultado de cada envio, em vez de só
// disparar e torcer.
export async function notificarSlack(construirTexto: (nome: string) => string): Promise<ResultadoEnvioSlack[]> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return []

  return Promise.all(
    destinatarios().map(async (d) => {
      const resp = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ channel: d.id, text: construirTexto(d.nome || 'equipe') }),
      })

      const json = await resp.json().catch(() => ({ ok: false, error: 'resposta inválida do Slack' }))

      return { destinatario: d.nome || d.id, ok: Boolean(json.ok), error: json.ok ? undefined : json.error }
    })
  )
}
