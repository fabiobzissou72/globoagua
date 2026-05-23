import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth check
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.N8N_API_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { razao_social, nome_fantasia, cnpj, whatsapp } = body

    if (!razao_social) {
      return NextResponse.json({ success: false, error: 'razao_social is required' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('b2b_companies')
      .insert({ razao_social, nome_fantasia, cnpj, whatsapp })
      .select('id')
      .single()

    if (error) {
      console.error('[n8n/empresas]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('[n8n/empresas]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
