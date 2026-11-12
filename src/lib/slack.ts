// A entrega de verdade pro Slack agora é feita pelo n8n (reaproveitando o
// mesmo bot/credencial que a SARA já usa pra DM em outros fluxos) — este
// arquivo só monta a saudação por horário, usada na composição das mensagens.
export function saudacao(hoje: Date = new Date()) {
  const hora = hoje.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
