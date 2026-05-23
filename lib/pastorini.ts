// Pastorini WhatsApp API integration
const BASE_URL = process.env.PASTORINI_API_URL
const API_KEY = process.env.PASTORINI_API_KEY
const INSTANCE = process.env.PASTORINI_INSTANCE

async function post(endpoint: string, body: object) {
  if (!BASE_URL || !API_KEY || !INSTANCE) {
    console.warn('[Pastorini] Credenciais não configuradas')
    return { success: false, error: 'not_configured' }
  }
  try {
    const res = await fetch(`${BASE_URL}/api/instances/${INSTANCE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch (err) {
    console.error('[Pastorini] Erro:', err)
    return { success: false, error: String(err) }
  }
}

function toJid(phone: string) {
  const clean = phone.replace(/\D/g, '')
  const withCountry = clean.startsWith('55') ? clean : `55${clean}`
  return `${withCountry}@s.whatsapp.net`
}

export async function sendDeliveryReceipt(params: {
  phone: string
  clientName: string
  orderNumber: string
  items: { name: string; qty: number; price: number }[]
  total: number
  receivedBy: string
  deliveredAt: string
  address: string
}) {
  const itemLines = params.items
    .map(i => `  • ${i.name} x${i.qty} — R$ ${(i.price * i.qty).toFixed(2)}`)
    .join('\n')

  const text =
    `✅ *Comprovante de Entrega - Globo Água*\n\n` +
    `Olá, *${params.clientName}*!\n\n` +
    `📦 Pedido: *#${params.orderNumber}*\n` +
    `🕐 Entregue em: ${params.deliveredAt}\n` +
    `📍 Endereço: ${params.address}\n` +
    `👤 Recebido por: *${params.receivedBy}*\n\n` +
    `*Itens entregues:*\n${itemLines}\n\n` +
    `💰 *Total: R$ ${params.total.toFixed(2)}*\n\n` +
    `Obrigado pela preferência! 💧`

  return post('/send-text', { jid: toJid(params.phone), text })
}

export async function sendOrderConfirmation(params: {
  phone: string
  clientName: string
  orderNumber: string
  total: number
}) {
  const text =
    `🛒 *Pedido Confirmado - Globo Água*\n\n` +
    `Olá, *${params.clientName}*!\n\n` +
    `Seu pedido *#${params.orderNumber}* foi recebido.\n` +
    `💰 Total: *R$ ${params.total.toFixed(2)}*\n\n` +
    `Em breve um entregador será designado. 🚚\n` +
    `Acompanhe o status pelo app!`

  return post('/send-text', { jid: toJid(params.phone), text })
}
