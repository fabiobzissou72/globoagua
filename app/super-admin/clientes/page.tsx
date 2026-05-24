'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, User, Building2, Plus, X, Loader2, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Cliente {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  whatsapp?: string
  created_at: string
  tipo_pessoa?: string
  razao_social?: string
  nome_fantasia?: string
}

const defaultForm = () => ({
  nome_completo: '',
  email: '',
  whatsapp: '',
  senha: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
})

function NovoClienteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(defaultForm())
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function fetchCEP(val: string) {
    set('cep', val)
    const clean = val.replace(/\D/g, '')
    if (clean.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          set('logradouro', data.logradouro || '')
          set('bairro', data.bairro || '')
          set('cidade', data.localidade || '')
          set('uf', data.uf || '')
        } else toast.error('CEP não encontrado')
      } catch { toast.error('Erro ao buscar CEP') }
      finally { setCepLoading(false) }
    }
  }

  async function handleSave() {
    if (!form.nome_completo || !form.email) {
      toast.error('Nome e e-mail são obrigatórios')
      return
    }
    setSaving(true)
    try {
      const endereco = (form.logradouro || form.cep) ? {
        cep: form.cep,
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
      } : undefined

      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: form.nome_completo,
          email: form.email,
          whatsapp: form.whatsapp || undefined,
          senha: form.senha || undefined,
          endereco,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Cliente criado com sucesso!')
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <User size={20} className="text-[#1565C0]" /> Novo Cliente
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dados Pessoais</p>

          {[
            { key: 'nome_completo', label: 'Nome Completo *', placeholder: 'João da Silva', type: 'text' },
            { key: 'email', label: 'E-mail *', placeholder: 'joao@email.com', type: 'email' },
            { key: 'whatsapp', label: 'WhatsApp', placeholder: '(11) 99999-9999', type: 'tel' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input type={type} value={(form as Record<string, string>)[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder} className="input-base" />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Senha (opcional)</label>
            <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)}
              placeholder="Deixe em branco para senha padrão" className="input-base" />
            <p className="text-xs text-gray-400 mt-1">Padrão: GloboAgua@cliente</p>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <MapPin size={12} /> Endereço (opcional)
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input type="text" placeholder="CEP" value={form.cep}
                  onChange={e => fetchCEP(e.target.value)} maxLength={9} className="input-base pr-10" />
                {cepLoading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input type="text" placeholder="Logradouro" value={form.logradouro}
                    onChange={e => set('logradouro', e.target.value)} className="input-base" />
                </div>
                <input type="text" placeholder="Nº" value={form.numero}
                  onChange={e => set('numero', e.target.value)} className="input-base" />
              </div>
              <input type="text" placeholder="Complemento" value={form.complemento}
                onChange={e => set('complemento', e.target.value)} className="input-base" />
              <input type="text" placeholder="Bairro" value={form.bairro}
                onChange={e => set('bairro', e.target.value)} className="input-base" />
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input type="text" placeholder="Cidade" value={form.cidade}
                    onChange={e => set('cidade', e.target.value)} className="input-base" />
                </div>
                <input type="text" placeholder="UF" value={form.uf}
                  onChange={e => set('uf', e.target.value)} maxLength={2} className="input-base" />
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-5 py-3">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar Cliente'}
        </button>
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const sb = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await sb
      .from('profiles')
      .select('id, nome_completo, email, telefone, whatsapp, created_at, tipo_pessoa, razao_social, nome_fantasia')
      .eq('role', 'cliente')
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = clientes.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.nome_completo?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telefone?.includes(q) ||
      c.whatsapp?.includes(q)
    )
  })

  return (
    <div className="p-4 md:p-6 w-full max-w-5xl">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} cadastrados</p>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-base pl-9 w-full"
              placeholder="Buscar por nome, e-mail ou telefone"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary whitespace-nowrap">
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">Nenhum cliente encontrado</div>
        ) : filtered.map(c => (
          <div key={c.id} className="card p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <User size={15} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{c.nome_completo || '—'}</p>
                <p className="text-xs text-gray-500 truncate">{c.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              {c.tipo_pessoa === 'PJ' && (c.razao_social || c.nome_fantasia) ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  <Building2 size={11} /> {c.nome_fantasia || c.razao_social}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pessoa física</span>
              )}
              <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
            </div>
            {(c.whatsapp || c.telefone) && (
              <p className="text-xs text-gray-500">{c.whatsapp || c.telefone}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Cliente', 'E-mail / WhatsApp', 'Empresa B2B', 'Cadastro'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-gray-400">Nenhum cliente encontrado</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <div className="font-semibold text-gray-900">{c.nome_completo || '—'}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-700">{c.email}</div>
                    {(c.whatsapp || c.telefone) && (
                      <div className="text-xs text-gray-400">{c.whatsapp || c.telefone}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {c.tipo_pessoa === 'PJ' && (c.razao_social || c.nome_fantasia) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                        <Building2 size={11} /> {c.nome_fantasia || c.razao_social}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Pessoa física</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <NovoClienteModal onClose={() => setShowModal(false)} onSaved={load} />
      )}
    </div>
  )
}
