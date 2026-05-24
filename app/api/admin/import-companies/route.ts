import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

type CompanyRow = {
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  contato?: string
  email?: string
  faturado?: string | boolean
  prazo_faturamento?: string | number
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
}

function normalize(row: CompanyRow) {
  const cnpj = row.cnpj ? String(row.cnpj).replace(/\D/g, '') : null
  const contato = row.contato ? String(row.contato).replace(/\D/g, '') : null
  const faturado = row.faturado === true || String(row.faturado).toLowerCase() === 'true' || String(row.faturado) === '1'
  const prazo = Number(row.prazo_faturamento) || 30
  const hasEndereco = !!(row.logradouro || row.cep)
  return {
    razao_social: String(row.razao_social || '').trim(),
    nome_fantasia: row.nome_fantasia ? String(row.nome_fantasia).trim() : null,
    cnpj: cnpj || null,
    contato: contato || null,
    email: row.email ? String(row.email).trim().toLowerCase() : null,
    faturado,
    prazo_faturamento: prazo,
    endereco: hasEndereco ? {
      cep: row.cep || '',
      logradouro: row.logradouro || '',
      numero: row.numero || '',
      complemento: row.complemento || '',
      bairro: row.bairro || '',
      cidade: row.cidade || '',
      uf: row.uf || '',
    } : null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json() as { rows: CompanyRow[] }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha recebida' }, { status: 400 })
    }

    const sb = await createAdminClient()
    const results: { linha: number; status: 'ok' | 'erro'; razao_social: string; motivo?: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const normalized = normalize(row)

      if (!normalized.razao_social) {
        results.push({ linha: i + 2, status: 'erro', razao_social: row.razao_social || '(vazio)', motivo: 'razao_social obrigatória' })
        continue
      }

      try {
        if (normalized.cnpj) {
          // Upsert por CNPJ
          const { data: existing } = await sb.from('companies').select('id').eq('cnpj', normalized.cnpj).maybeSingle()
          if (existing) {
            const { error } = await sb.from('companies').update(normalized).eq('id', existing.id)
            if (error) throw new Error(error.message)
          } else {
            const { error } = await sb.from('companies').insert(normalized)
            if (error) throw new Error(error.message)
          }
        } else {
          const { error } = await sb.from('companies').insert(normalized)
          if (error) throw new Error(error.message)
        }
        results.push({ linha: i + 2, status: 'ok', razao_social: normalized.razao_social })
      } catch (e) {
        results.push({ linha: i + 2, status: 'erro', razao_social: normalized.razao_social, motivo: String(e) })
      }
    }

    const ok = results.filter(r => r.status === 'ok').length
    const erros = results.filter(r => r.status === 'erro').length
    return NextResponse.json({ ok, erros, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
