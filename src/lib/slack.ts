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

// `construirTexto` recebe o primeiro nome de cada destinatário, pra cada DM
// sair personalizada (ex: "Boa tarde, Thayana! ...").
export async function notificarSlack(construirTexto: (nome: string) => string) {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return

  await Promise.all(
    destinatarios().map((d) =>
      fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ channel: d.id, text: construirTexto(d.nome || 'equipe') }),
      })
    )
  )
}
