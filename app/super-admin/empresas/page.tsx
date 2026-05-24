'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, X, Building2, Loader2, Mail, MessageCircle, ChevronDown, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Company = {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  contato?: string
  email?: string
  created_at?: string
  faturado?: boolean
  prazo_faturamento?: number
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    uf?: string
  } | null
}

const defaultForm = () => ({
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  contato: '',
  email: '',
  faturado: false,
  prazo_faturamento: 30,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
})

function CompanyModal({ company, onClose, onSave }: {
  company?: Company | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState(company ? {
    razao_social: company.razao_social,
    nome_fantasia: company.nome_fantasia || '',
    cnpj: company.cnpj || '',
    contato: company.contato || '',
    email: company.email || '',
    faturado: company.faturado ?? false,
    prazo_faturamento: company.prazo_faturamento ?? 30,
    cep: company.endereco?.cep || '',
    logradouro: company.endereco?.logradouro || '',
    numero: company.endereco?.numero || '',
    complemento: company.endereco?.complemento || '',
    bairro: company.endereco?.bairro || '',
    cidade: company.endereco?.cidade || '',
    uf: company.endereco?.uf || '',
  } : defaultForm())
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  const set = (k: string, v: string | boolean | number) => setForm(f => ({ ...f, [k]: v }))

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

  const handleSave = async () => {
    if (!form.razao_social) { toast.error('Razão social é obrigatória'); return }
    setSaving(true)
    const supabase = createClient()

    const endereco = form.logradouro || form.cep ? {
      cep: form.cep,
      logradouro: form.logradouro,
      numero: form.numero,
      complemento: form.complemento,
      bairro: form.bairro,
      cidade: form.cidade,
      uf: form.uf,
    } : null

    const payload = {
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia,
      cnpj: form.cnpj,
      contato: form.contato,
      email: form.email,
      faturado: form.faturado,
      prazo_faturamento: form.prazo_faturamento,
      endereco,
    }

    let error
    if (company) {
      ({ error } = await supabase.from('companies').update(payload).eq('id', company.id))
    } else {
      ({ error } = await supabase.from('companies').insert(payload))
    }
    if (error) toast.error('Erro ao salvar')
    else { toast.success('Empresa salva!'); onSave(); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Building2 size={20} className="text-[#1565C0]" />
            {company ? 'Editar Empresa' : 'Nova Empresa B2B'}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {[
            { key: 'razao_social', label: 'Razão Social *', placeholder: 'Nome empresarial completo' },
            { key: 'nome_fantasia', label: 'Nome Fantasia', placeholder: 'Nome comercial' },
            { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
            { key: 'contato', label: 'Contato WhatsApp', placeholder: '(11) 99999-9999' },
            { key: 'email', label: 'E-mail', placeholder: 'contato@empresa.com.br' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input
                value={(form as unknown as Record<string, string>)[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="input-base"
              />
            </div>
          ))}

          {/* Faturamento */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => set('faturado', !form.faturado)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.faturado ? 'bg-[#1565C0]' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.faturado ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Cobrança Faturada</p>
                <p className="text-xs text-gray-500">Empresa não paga no ato — prazo de fatura</p>
              </div>
            </label>
            {form.faturado && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Prazo (dias)</label>
                <input type="number" min="1" value={form.prazo_faturamento}
                  onChange={e => set('prazo_faturamento', Number(e.target.value))}
                  className="input-base" placeholder="30" />
              </div>
            )}
          </div>

          {/* Endereço */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <MapPin size={12} /> Endereço da Empresa
            </p>
            <div className="relative">
              <input type="text" placeholder="CEP" value={form.cep}
                onChange={e => fetchCEP(e.target.value)} maxLength={9} className="input-base pr-10" />
              {cepLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input type="text" placeholder="Logradouro" value={form.logradouro}
                  onChange={e => set('logradouro', e.target.value)} className="input-base" />
              </div>
              <input type="text" placeholder="Nº" value={form.numero}
                onChange={e => set('numero', e.target.value)} className="input-base" />
            </div>
            <input type="text" placeholder="Complemento (opcional)" value={form.complemento}
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
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-5 py-3">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar Empresa'}
        </button>
      </div>
    </div>
  )
}

type DropdownPos = { top: number; left: number; openUp: boolean }

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; company?: Company | null }>({ open: false })
  const [inviting, setInviting] = useState<string | null>(null)
  const [inviteMenu, setInviteMenu] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const closeMenu = useCallback(() => {
    setInviteMenu(null)
    setDropdownPos(null)
  }, [])

  // Fecha ao clicar fora ou rolar
  useEffect(() => {
    if (!inviteMenu) return
    const handler = () => closeMenu()
    document.addEventListener('mousedown', handler)
    document.addEventListener('scroll', handler, true)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('scroll', handler, true)
    }
  }, [inviteMenu, closeMenu])

  const openInviteMenu = (companyId: string) => {
    if (inviteMenu === companyId) { closeMenu(); return }
    const btn = btnRefs.current[companyId]
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 100
    setDropdownPos({
      top: openUp ? rect.top - 8 : rect.bottom + 4,
      left: rect.left,
      openUp,
    })
    setInviteMenu(companyId)
  }

  useEffect(() => { loadCompanies() }, [])

  async function loadCompanies() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('companies').select('*').order('razao_social')
    if (data) setCompanies(data)
    setLoading(false)
  }

  const inviteCompany = async (company: Company, channel: 'email' | 'whatsapp') => {
    if (!company.email) {
      toast.error('Cadastre um e-mail para esta empresa antes de convidar')
      return
    }
    if (channel === 'whatsapp' && !company.contato) {
      toast.error('Cadastre o WhatsApp desta empresa antes de enviar pelo WhatsApp')
      return
    }
    setInviteMenu(null)
    setInviting(company.id)
    try {
      const res = await fetch('/api/admin/invite-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: company.email,
          company_id: company.id,
          company_name: company.nome_fantasia || company.razao_social,
          channel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.status === 'whatsapp' && data.whatsapp_msg) {
        const phone = `55${company.contato!.replace(/\D/g, '')}`
        window.open(`https://wa.me/${phone}?text=${data.whatsapp_msg}`, '_blank')
        toast.success('WhatsApp aberto com as credenciais de acesso!')
      } else {
        toast.success('Acesso enviado por e-mail!')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar convite')
    } finally {
      setInviting(null)
    }
  }

  const deleteCompany = async (id: string) => {
    if (!confirm('Excluir esta empresa?')) return
    const supabase = createClient()
    await supabase.from('companies').delete().eq('id', id)
    setCompanies(prev => prev.filter(c => c.id !== id))
    toast.success('Empresa excluída')
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Empresas B2B</h1>
          <p className="text-sm text-gray-500">{companies.length} cadastradas</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary">
          <Plus size={18} /> Nova Empresa
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : companies.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Building2 size={48} strokeWidth={1} className="mx-auto mb-3" />
          <p className="font-semibold">Nenhuma empresa cadastrada</p>
          <p className="text-sm mt-1">Clique em "Nova Empresa" para começar</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Razão Social', 'Nome Fantasia', 'CNPJ', 'Contato WhatsApp', 'E-mail', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{c.razao_social}</td>
                    <td className="px-4 py-3 text-gray-600">{c.nome_fantasia || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{c.cnpj || '—'}</td>
                    <td className="px-4 py-3">
                      {c.contato ? (
                        <a href={`https://wa.me/55${c.contato.replace(/\D/g, '')}`} target="_blank"
                          className="text-[#2E7D32] hover:underline font-medium">
                          {c.contato}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="text-[#1565C0] hover:underline">
                          {c.email}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setModal({ open: true, company: c })}
                          className="btn-secondary text-xs py-1.5 px-3">
                          <Edit2 size={13} /> Editar
                        </button>

                        {/* Botão de convite com dropdown flutuante */}
                        <button
                          ref={el => { btnRefs.current[c.id] = el }}
                          onClick={() => c.email ? openInviteMenu(c.id) : toast.error('Cadastre um e-mail primeiro')}
                          disabled={inviting === c.id}
                          className={`text-xs py-1.5 px-3 rounded-xl border font-semibold flex items-center gap-1 transition-all
                            ${c.email ? 'border-[#1565C0] text-[#1565C0] hover:bg-blue-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
                          {inviting === c.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Mail size={13} />}
                          Convidar
                          <ChevronDown size={12} className={`transition-transform ${inviteMenu === c.id ? 'rotate-180' : ''}`} />
                        </button>

                        <button onClick={() => deleteCompany(c.id)} className="btn-danger">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dropdown flutuante via portal — não sofre com overflow da tabela */}
      {inviteMenu && dropdownPos && typeof document !== 'undefined' && createPortal(
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: dropdownPos.openUp ? undefined : dropdownPos.top,
            bottom: dropdownPos.openUp ? window.innerHeight - dropdownPos.top : undefined,
            left: dropdownPos.left,
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-slide-up"
        >
          {(() => {
            const c = companies.find(x => x.id === inviteMenu)
            if (!c) return null
            return (
              <>
                <button
                  onClick={() => inviteCompany(c, 'email')}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-blue-50 text-gray-700 font-medium">
                  <Mail size={15} className="text-[#1565C0]" /> Enviar por E-mail
                </button>
                <button
                  onClick={() => inviteCompany(c, 'whatsapp')}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-green-50 text-gray-700 font-medium border-t">
                  <MessageCircle size={15} className="text-[#2E7D32]" /> Enviar pelo WhatsApp
                </button>
              </>
            )
          })()}
        </div>,
        document.body
      )}

      {modal.open && (
        <CompanyModal company={modal.company} onClose={() => setModal({ open: false })} onSave={loadCompanies} />
      )}
    </div>
  )
}
