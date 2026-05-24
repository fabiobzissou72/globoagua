import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  try {
    const { userId, month, year, emailTo } = await req.json()
    if (!userId || !emailTo) return NextResponse.json({ error: 'userId e emailTo são obrigatórios' }, { status: 400 })

    const supabase = await createAdminClient()

    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month, 1).toISOString()

    const { data: orders } = await supabase
      .from('orders')
      .select('id, numero_pedido, created_at, status, cliente_nome, endereco_completo, total, metodo_pagamento')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: true })

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Nenhum pedido neste período' }, { status: 400 })
    }

    // Busca itens de todos os pedidos
    const { data: allItems } = await supabase
      .from('order_items')
      .select('order_id, produto_nome, quantidade, preco_unitario, subtotal')
      .in('order_id', orders.map(o => o.id))

    const { data: profile } = await supabase
      .from('profiles')
      .select('nome_completo, email')
      .eq('id', userId)
      .maybeSingle()

    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    const monthLabel = `${monthNames[month - 1]} ${year}`

    // Gera linhas para Excel (um row por item)
    const rows: Record<string, string | number>[] = []
    for (const order of orders) {
      const items = (allItems || []).filter(i => i.order_id === order.id)
      const dt = new Date(order.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
      const pay = order.metodo_pagamento === 'pix' ? 'PIX' : order.metodo_pagamento === 'cartao' ? 'Cartão' : order.metodo_pagamento === 'faturado' ? 'Faturado' : 'Dinheiro'
      if (items.length === 0) {
        rows.push({ 'Nº Pedido': order.numero_pedido, 'Data': dt, 'Status': order.status, 'Produto': '', 'Qtd': '', 'Unit. R$': '', 'Subtotal R$': '', 'Total Pedido R$': Number(order.total).toFixed(2), 'Pagamento': pay, 'Endereço': order.endereco_completo })
      } else {
        items.forEach((item, idx) => {
          rows.push({
            'Nº Pedido': idx === 0 ? order.numero_pedido : '',
            'Data': idx === 0 ? dt : '',
            'Status': idx === 0 ? order.status : '',
            'Produto': item.produto_nome,
            'Qtd': item.quantidade,
            'Unit. R$': Number(item.preco_unitario).toFixed(2),
            'Subtotal R$': Number(item.subtotal).toFixed(2),
            'Total Pedido R$': idx === 0 ? Number(order.total).toFixed(2) : '',
            'Pagamento': idx === 0 ? pay : '',
            'Endereço': idx === 0 ? order.endereco_completo : '',
          })
        })
      }
    }

    const totalGeral = orders.reduce((s, o) => s + Number(o.total), 0)
    rows.push({})
    rows.push({ 'Nº Pedido': `TOTAL: ${orders.length} pedidos`, 'Total Pedido R$': totalGeral.toFixed(2) })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 28 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, monthLabel)
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const base64 = Buffer.from(buffer).toString('base64')

    // Envia por e-mail via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 })

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

    const htmlRows = orders.map(o => {
      const dt = new Date(o.created_at).toLocaleDateString('pt-BR')
      const pay = o.metodo_pagamento === 'pix' ? 'PIX' : o.metodo_pagamento === 'cartao' ? 'Cartão' : o.metodo_pagamento === 'faturado' ? 'Faturado' : 'Dinheiro'
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:8px 12px;font-weight:600">#${o.numero_pedido}</td>
        <td style="padding:8px 12px">${dt}</td>
        <td style="padding:8px 12px">${o.status}</td>
        <td style="padding:8px 12px">${pay}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:600">R$ ${Number(o.total).toFixed(2)}</td>
      </tr>`
    }).join('')

    await resend.emails.send({
      from: 'Globo Água <noreply@globoagua.com.br>',
      to: emailTo,
      subject: `📊 Relatório de Pedidos — ${monthLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px">
          <h2 style="color:#1565C0;margin-bottom:4px">Relatório de Pedidos — ${monthLabel}</h2>
          <p style="color:#666;font-size:13px">Cliente: <strong>${profile?.nome_completo || ''}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px">
            <thead><tr style="background:#f0f4ff">
              <th style="padding:10px 12px;text-align:left">Pedido</th>
              <th style="padding:10px 12px;text-align:left">Data</th>
              <th style="padding:10px 12px;text-align:left">Status</th>
              <th style="padding:10px 12px;text-align:left">Pagamento</th>
              <th style="padding:10px 12px;text-align:right">Total</th>
            </tr></thead>
            <tbody>${htmlRows}</tbody>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f0f4ff;border-radius:12px;text-align:right">
            <p style="font-size:18px;font-weight:900;color:#1565C0">Total do mês: R$ ${totalGeral.toFixed(2)}</p>
            <p style="font-size:13px;color:#666">${orders.length} pedido(s) em ${monthLabel}</p>
          </div>
          <p style="font-size:12px;color:#999;margin-top:24px">Planilha completa em anexo · Globo Água 💧</p>
        </div>
      `,
      attachments: [{
        filename: `pedidos_${monthLabel.replace(' ', '_')}.xlsx`,
        content: base64,
      }],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-report]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
