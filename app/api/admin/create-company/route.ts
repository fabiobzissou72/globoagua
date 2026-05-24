import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// API route para o Hermes/agentes criarem empresa sem precisar de sessão browser
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      razao_social, nome_fantasia, cnpj, contato, email,
      faturado, prazo_faturamento,
      cep, logradouro, numero, complemento, bairro, cidade, uf,
    } = body

    if (!razao_social) {
      return NextResponse.json({ error: 'razao_social é obrigatória' }, { status: 400 })
    }

    const sb = await createAdminClient()

    const endereco = logradouro ? { cep, logradouro, numero, complemento, bairro, cidade, uf } : null

    const cnpjClean = cnpj ? cnpj.replace(/\D/g, '') : null
    const contatoClean = contato ? contato.replace(/\D/g, '') : null

    const payload = {
      razao_social,
      nome_fantasia: nome_fantasia || null,
      cnpj: cnpjClean,
      contato: contatoClean,
      email: email || null,
      faturado: faturado === true || faturado === 'true',
      prazo_faturamento: Number(prazo_faturamento) || 30,
      endereco,
    }

    // Upsert por CNPJ se informado
    let result
    if (cnpjClean) {
      const { data: existing } = await sb.from('companies').select('id').eq('cnpj', cnpjClean).maybeSingle()
      if (existing) {
        result = await sb.from('companies').update(payload).eq('id', existing.id).select().single()
      } else {
        result = await sb.from('companies').insert(payload).select().single()
      }
    } else {
      result = await sb.from('companies').insert(payload).select().single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, company: result.data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
