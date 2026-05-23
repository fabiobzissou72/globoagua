import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendInviteEmail } from '@/lib/mailer'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  const { email, company_id, company_name, channel } = await request.json()

  if (!email || !company_id) {
    return NextResponse.json({ error: 'email e company_id são obrigatórios' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const tempPassword = generateTempPassword()

  // Verifica se usuário já existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === email)

  let userId: string

  const meta = { company_id, role: 'cliente_b2b', nome_completo: company_name, must_change_password: true }

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: tempPassword,
      user_metadata: meta,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    userId = existingUser.id
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: meta,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    userId = data.user.id
  }

  // Vincula ao company_id no profile
  await supabase.from('profiles').upsert({
    id: userId,
    company_id,
    role: 'cliente_b2b',
    updated_at: new Date().toISOString(),
  })

  if (channel === 'whatsapp') {
    const name = company_name
    const msg = encodeURIComponent(
      `Olá, ${name}! 👋\n\nSeu acesso ao sistema Globo Água está pronto.\n\n🔑 *E-mail:* ${email}\n🔑 *Senha:* ${tempPassword}\n\n👉 Acesse: ${appUrl}/login\n\n⚠️ Troque sua senha após o primeiro acesso.`
    )
    return NextResponse.json({ status: 'whatsapp', whatsapp_msg: msg })
  }

  // Envia email com senha temporária
  try {
    await sendInviteEmail({
      to: email,
      companyName: company_name,
      inviteLink: `${appUrl}/login`,
      tempPassword,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Erro SMTP:', msg)
    return NextResponse.json({ error: `Erro ao enviar email: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ status: 'invited', message: 'Acesso enviado por e-mail' })
}
