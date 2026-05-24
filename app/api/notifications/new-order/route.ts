import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 })

    const supabase = await createAdminClient()

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

    // Busca dados da empresa se B2B
    let company = null
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', order.user_id)
        .maybeSingle()
      if (profile?.company_id) {
        const { data: comp } = await supabase
          .from('companies')
          .select('id, razao_social, nome_fantasia, cnpj, faturado, prazo_faturamento, email, contato')
          .eq('id', profile.company_id)
          .maybeSingle()
        company = comp
      }
    }

    // Lê settings (webhook URL e whatsapp do admin)
    const { data: settingsRows } = await supabase.from('settings').select('key, value')
    const merged: Record<string, string> = {}
    ;(settingsRows || []).forEach((row: { key: string; value: Record<string, string> }) =>
      Object.assign(merged, row.value)
    )
    const webhookUrl = merged.speedit_webhook
    const adminWhatsapp = merged.whatsapp

    const itemLines = (items || [])
      .map(i => `  • ${i.produto_nome} x${i.quantidade} — R$ ${Number(i.subtotal).toFixed(2)}`)
      .join('\n')

    const payLabel =
      order.metodo_pagamento === 'pix' ? '⚡ PIX' :
      order.metodo_pagamento === 'cartao' ? '💳 Cartão' :
      order.metodo_pagamento === 'faturado' ? `📋 Faturado ${company?.prazo_faturamento || 30}d` :
      '💵 Dinheiro'

    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    // WhatsApp para o admin
    const pastoriniUrl = process.env.PASTORINI_API_URL
    const pastoriniKey = process.env.PASTORINI_API_KEY
    const pastoriniInstance = process.env.PASTORINI_INSTANCE

    if (adminWhatsapp && pastoriniUrl && pastoriniKey && pastoriniInstance) {
      const adminPhone = adminWhatsapp.replace(/\D/g, '')
      const adminJid = `${adminPhone.startsWith('55') ? adminPhone : `55${adminPhone}`}@s.whatsapp.net`

      const adminMsg =
        `🛒 *Novo Pedido — Globo Água*\n\n` +
        `📋 *#${order.numero_pedido}*  |  ${now}\n\n` +
        `👤 *Cliente:* ${order.cliente_nome}\n` +
        `📱 *WhatsApp:* ${order.cliente_whatsapp || '—'}\n` +
        (company
          ? `🏢 *Empresa:* ${company.nome_fantasia || company.razao_social}` +
            (company.cnpj ? ` (${company.cnpj})` : '') + '\n'
          : '') +
        `📍 *Endereço:* ${order.endereco_completo}\n\n` +
        `*Itens:*\n${itemLines}\n\n` +
        `💰 *Total: R$ ${Number(order.total).toFixed(2)}*\n` +
        `💳 *Pagamento:* ${payLabel}\n` +
        (order.observacoes ? `\n📝 *Obs:* ${order.observacoes}` : '')

      try {
        await fetch(
          `${pastoriniUrl}/api/instances/${pastoriniInstance}/send-text`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': pastoriniKey },
            body: JSON.stringify({ jid: adminJid, text: adminMsg }),
          }
        )
      } catch (e) {
        console.error('[new-order] WhatsApp admin error:', e)
      }
    }

    // Webhook (speedit / n8n / qualquer URL)
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order.created',
            order_id: order.id,
            numero_pedido: order.numero_pedido,
            created_at: order.created_at,
            cliente_nome: order.cliente_nome,
            cliente_whatsapp: order.cliente_whatsapp,
            endereco: order.endereco_completo,
            cidade: order.endereco_cidade,
            estado: order.endereco_estado,
            total: order.total,
            subtotal: order.subtotal,
            metodo_pagamento: order.metodo_pagamento,
            status: order.status,
            observacoes: order.observacoes || null,
            branch_id: order.branch_id || null,
            company: company
              ? {
                  id: company.id,
                  razao_social: company.razao_social,
                  nome_fantasia: company.nome_fantasia,
                  cnpj: company.cnpj,
                  faturado: company.faturado,
                  prazo_faturamento: company.prazo_faturamento,
                  email: company.email,
                  whatsapp: company.contato,
                }
              : null,
            items: (items || []).map(i => ({
              produto: i.produto_nome,
              quantidade: i.quantidade,
              preco_unitario: i.preco_unitario,
              subtotal: i.subtotal,
            })),
          }),
        })
      } catch (e) {
        console.error('[new-order] Webhook error:', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[new-order]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
