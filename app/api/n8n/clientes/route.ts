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
    const { email, nome_completo, whatsapp, documento, tipo_pessoa } = body

    if (!email || !nome_completo) {
      return NextResponse.json({ success: false, error: 'email and nome_completo are required' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: `${Date.now()}`, // Temporary password — user will reset
      email_confirm: true,
      user_metadata: {
        nome_completo,
        whatsapp,
      },
    })

    if (authError) {
      console.error('[n8n/clientes] auth error:', authError)
      return NextResponse.json({ success: false, error: authError.message }, { status: 500 })
    }

    const userId = authData.user.id

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        nome_completo,
        whatsapp,
        documento,
        tipo_pessoa: tipo_pessoa || 'pf',
        role: 'cliente',
        is_admin: false,
      })

    if (profileError) {
      console.error('[n8n/clientes] profile error:', profileError)
      // Don't fail — user was created, profile can be updated later
    }

    return NextResponse.json({ success: true, id: userId })
  } catch (err) {
    console.error('[n8n/clientes]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
