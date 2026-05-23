'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Droplets, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function SetPasswordPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const sb = createClient()
    // Supabase detecta o token do hash automaticamente e dispara onAuthStateChange
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          const meta = session.user.user_metadata
          setUserName(meta?.nome_completo || meta?.company_name || session.user.email || '')
          setChecking(false)
        }
      }
    })

    // Fallback: verifica sessão atual
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata
        setUserName(meta?.nome_completo || meta?.company_name || session.user.email || '')
        setChecking(false)
      } else {
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < 6) { setError('Senha mínima de 6 caracteres'); return }
    if (senha !== confirma) { setError('As senhas não coincidem'); return }

    setLoading(true)
    setError('')
    const sb = createClient()
    const { error: updateError } = await sb.auth.updateUser({ password: senha })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/'), 2500)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #1565C0, #0D47A1)' }}>
        <Loader2 size={36} className="animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(145deg, #1565C0, #0D47A1)' }}>
      <div className="w-full max-w-sm animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
              style={{ background: 'linear-gradient(135deg, #1565C0, #2E7D32)' }}>
              <Droplets size={32} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {done ? 'Tudo pronto!' : 'Defina sua senha'}
            </h1>
            {!done && userName && (
              <p className="text-gray-500 text-sm mt-1">Bem-vindo(a), <strong>{userName}</strong></p>
            )}
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={56} className="mx-auto text-green-500" />
              <p className="text-gray-700 font-medium">Senha criada com sucesso!</p>
              <p className="text-gray-400 text-sm">Redirecionando para a loja...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nova senha *</label>
                <div className="relative">
                  <input
                    className="input-base pr-12"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar senha *</label>
                <input
                  className="input-base"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirma}
                  onChange={e => setConfirma(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Salvando...</>
                  : 'Criar minha senha →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
