// Envia DM via bot do Slack (app SARA) pra uma lista fixa de pessoas, em vez
// de um Incoming Webhook num canal — usa o mesmo mecanismo que a SARA já usa
// nos fluxos do n8n (chat.postMessage com o ID do usuário como "channel").
const DEFAULT_DM_USER_IDS = ['U06E67Z9HHT', 'U04P493PCAJ'] // thayanasales.intituto, reis.rodolpho

export async function notificarSlack(texto: string) {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return

  const userIds = (process.env.SLACK_DM_USER_IDS || DEFAULT_DM_USER_IDS.join(','))
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  await Promise.all(
    userIds.map((userId) =>
      fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ channel: userId, text: texto }),
      })
    )
  )
}
