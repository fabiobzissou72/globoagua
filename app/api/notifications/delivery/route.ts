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
      .select('product_name, qty, unit_price, total')
      .eq('order_id', orderId)

    // Send WhatsApp receipt
    if (order.cliente_whatsapp) {
      await sendDeliveryReceipt({
        phone: order.cliente_whatsapp,
        clientName: order.cliente_nome,
        orderNumber: order.numero_pedido,
        items: (items || []).map(i => ({
          name: i.product_name,
          qty: i.qty,
          price: i.unit_price,
        })),
        total: order.total,
        receivedBy: order.received_by || order.cliente_nome,
        deliveredAt: formatDate(new Date().toISOString()),
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
          <td style="padding:6px 12px;">${i.product_name}</td>
          <td style="padding:6px 12px;text-align:center;">${i.qty}</td>
          <td style="padding:6px 12px;text-align:right;">R$ ${i.total.toFixed(2)}</td>
        </tr>`).join('')

        await resend.emails.send({
          from: 'Globo Água <noreply@globoagua.com.br>',
          to: order.cliente_email,
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

    // Mark order as delivered
    await supabase.from('orders').update({ status: 'entregue', delivered_at: new Date().toISOString() }).eq('id', orderId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notifications/delivery]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
