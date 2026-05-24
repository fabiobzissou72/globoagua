import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { nome_completo, email, whatsapp, senha, endereco } = await req.json()

  if (!nome_completo || !email) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
  }

  const sb = await createAdminClient()

  const { data: user, error: authError } = await sb.auth.admin.createUser({
    email,
    password: senha || 'GloboAgua@cliente',
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const profile: Record<string, unknown> = {
    id: user.user.id,
    email,
    nome_completo,
    role: 'cliente',
  }
  if (whatsapp) profile.whatsapp = whatsapp
  if (endereco) profile.endereco_padrao = endereco

  const { error: profileError } = await sb.from('profiles').upsert(profile)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, id: user.user.id })
}
