'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { normalizePhone, phoneToDriverEmail } from '@/lib/utils'
import { Droplets, Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || null
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password) { setError('Preencha os dois campos'); return }
    setLoading(true); setError('')

    const sb = createClient()
    const phone = normalizePhone(identifier)
    const isPhone = /^\d{10,11}$/.test(phone)

    try {
      if (isPhone) {
        // Entregador — login por telefone
        const { error: err } = await sb.auth.signInWithPassword({
          email: phoneToDriverEmail(phone), password,
        })
        if (err) { setError('Telefone ou senha incorretos.'); return }
        router.push('/entregador')
        return
      }

      // Email — tenta login
      const { data, error: err } = await sb.auth.signInWithPassword({
        email: identifier.trim(), password,
      })
      if (err) {
        const msg = err.message.toLowerCase()
        if (msg.includes('email not confirmed')) setError('Conta não confirmada. Fale com o administrador.')
        else setError('E-mail ou senha incorretos.')
        return
      }

      // Busca role
      const { data: profile } = await sb.from('profiles')
        .select('role, is_admin').eq('id', data.user.id).maybeSingle()

      const role = profile?.role || ''
      const isAdmin = !!profile?.is_admin
      const superAdminEmail = 'fabiobz@gmail.com'
      const isSuperAdmin = role === 'super_admin' || (isAdmin && identifier.trim() === superAdminEmail)

      if (isSuperAdmin) { router.push('/super-admin'); return }
      if (isAdmin || role === 'admin') { router.push('/admin'); return }
      if (data.user.user_metadata?.must_change_password) { router.push('/perfil?aviso=senha'); return }
      router.push(nextUrl || '/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #1565C0, #0D47A1)' }}>
      <div className="w-full max-w-sm animate-slide-up">
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
              style={{ background: 'linear-gradient(135deg, #1565C0, #2E7D32)' }}>
              <Droplets size={32} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Globo Água</h1>
            <p className="text-gray-500 text-sm mt-1">Entre com seu acesso</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                E-mail ou celular
              </label>
              <input
                className="input-base"
                type="text"
                placeholder="email@exemplo.com ou 11999999999"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  className="input-base pr-12"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Você será redirecionado para sua área automaticamente.
          </p>
          {(!nextUrl || nextUrl === '/checkout') && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Primeira compra?{' '}
              <a href="/cadastro" className="text-[#1565C0] font-semibold hover:underline">
                Criar conta
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #1565C0, #0D47A1)' }}>
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
