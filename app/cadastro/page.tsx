'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { normalizePhone } from '@/lib/utils'
import { Droplets, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || '/'

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !senha) { setError('Preencha todos os campos obrigatórios'); return }
    if (senha.length < 6) { setError('Senha mínima de 6 caracteres'); return }

    setLoading(true); setError('')
    const sb = createClient()

    const { data, error: signUpError } = await sb.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome_completo: nome.trim() } },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) setError('Este e-mail já está cadastrado.')
      else setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await sb.from('profiles').upsert({
        id: data.user.id,
        email: email.trim(),
        nome_completo: nome.trim(),
        telefone: normalizePhone(telefone),
        role: 'cliente',
      })
    }

    router.push(nextUrl)
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
            <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
            <p className="text-gray-500 text-sm mt-1">Rápido e grátis</p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo *</label>
              <input className="input-base" placeholder="Seu nome" value={nome}
                onChange={e => setNome(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail *</label>
              <input className="input-base" type="email" placeholder="email@exemplo.com" value={email}
                onChange={e => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp</label>
              <input className="input-base" type="tel" placeholder="11999999999" value={telefone}
                onChange={e => setTelefone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha *</label>
              <div className="relative">
                <input className="input-base pr-12" type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres" value={senha}
                  onChange={e => setSenha(e.target.value)} autoComplete="new-password" />
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
              {loading ? <><Loader2 size={18} className="animate-spin" /> Criando conta...</> : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta?{' '}
            <Link href={`/login${nextUrl !== '/' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
              className="text-[#1565C0] font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #1565C0, #0D47A1)' }}>
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    }>
      <CadastroForm />
    </Suspense>
  )
}
