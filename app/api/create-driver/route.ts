import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { nome_completo, telefone, email, senha } = await req.json()

  if (!nome_completo || !telefone || !email) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const sb = await createAdminClient()

  const { data: user, error: authError } = await sb.auth.admin.createUser({
    email,
    password: senha || 'GloboAgua@entregador',
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { error: profileError } = await sb.from('profiles').upsert({
    id: user.user.id,
    email,
    nome_completo,
    telefone,
    role: 'entregador',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, id: user.user.id })
}
