import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDeliveryReceipt } from '@/lib/pastorini'
import { formatDate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 })

    const supabase = await createAdminClient()

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('produto_nome, quantidade, preco_unitario, subtotal')
      .eq('order_id', orderId)

    const deliveredAt = order.entregue_em
      ? new Date(order.entregue_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : formatDate(new Date().toISOString())

    // Send WhatsApp receipt
    if (order.cliente_whatsapp) {
      await sendDeliveryReceipt({
        phone: order.cliente_whatsapp,
        clientName: order.cliente_nome,
        orderNumber: order.numero_pedido,
        items: (items || []).map(i => ({
          name: i.produto_nome,
          qty: i.quantidade,
          price: i.preco_unitario,
        })),
        total: order.total,
        receivedBy: order.recebedor_nome || order.cliente_nome,
        deliveredAt,
        address: order.endereco_completo || '',
      })
    }

    // Optional: Send email via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && order.cliente_email) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        const itemHtml = (items || []).map(i => `<tr>
          <td style="padding:6px 12px;">${i.produto_nome}</td>
          <td style="padding:6px 12px;text-align:center;">${i.quantidade}</td>
          <td style="padding:6px 12px;text-align:right;">R$ ${i.subtotal.toFixed(2)}</td>
        </tr>`).join('')

        const { data: profile } = await supabase.from('profiles').select('email').eq('id', order.user_id).maybeSingle()
        const recipientEmail = profile?.email || order.cliente_email
        if (!recipientEmail) return
        await resend.emails.send({
          from: 'Globo Água <noreply@globoagua.com.br>',
          to: recipientEmail,
          subject: `✅ Pedido #${order.numero_pedido} entregue!`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#1565C0;">Pedido Entregue! ✅</h2>
              <p>Olá <strong>${order.cliente_nome}</strong>, seu pedido foi entregue com sucesso.</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                <thead><tr style="background:#f5f5f5;">
                  <th style="padding:8px 12px;text-align:left;">Produto</th>
                  <th style="padding:8px 12px;text-align:center;">Qtd</th>
                  <th style="padding:8px 12px;text-align:right;">Total</th>
                </tr></thead>
                <tbody>${itemHtml}</tbody>
              </table>
              <p style="margin-top:16px;font-size:18px;"><strong>Total: R$ ${order.total.toFixed(2)}</strong></p>
              <p style="color:#666;font-size:13px;">Obrigado pela preferência! 💧</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('[notifications/delivery] Email error:', emailErr)
      }
    }

    // Dispara webhook configurado nas settings (Speedit / n8n / qualquer URL)
    const { data: settingsRows } = await supabase.from('settings').select('key, value')
    const merged: Record<string, string> = {}
    ;(settingsRows || []).forEach((row: { key: string; value: Record<string, string> }) =>
      Object.assign(merged, row.value)
    )
    const webhookUrl = merged.speedit_webhook
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order.delivered',
            order_id: order.id,
            numero_pedido: order.numero_pedido,
            cliente_nome: order.cliente_nome,
            cliente_whatsapp: order.cliente_whatsapp,
            endereco: order.endereco_completo,
            total: order.total,
            metodo_pagamento: order.metodo_pagamento,
            recebedor_nome: order.recebedor_nome,
            entregue_em: order.entregue_em || new Date().toISOString(),
            items: (items || []).map(i => ({
              produto: i.produto_nome,
              quantidade: i.quantidade,
              preco_unitario: i.preco_unitario,
              subtotal: i.subtotal,
            })),
          }),
        })
      } catch (webhookErr) {
        console.error('[notifications/delivery] Webhook error:', webhookErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notifications/delivery]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
