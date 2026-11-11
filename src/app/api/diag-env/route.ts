export const dynamic = 'force-dynamic'

export async function GET() {
  const secret = process.env.CRON_SECRET || ''
  const webhook = process.env.SLACK_WEBHOOK_URL || ''

  return Response.json({
    cronSecretSet: secret.length > 0,
    cronSecretLength: secret.length,
    cronSecretPrimeiros4: secret.slice(0, 4),
    webhookSet: webhook.length > 0,
    webhookComeca: webhook.slice(0, 25),
  })
}
