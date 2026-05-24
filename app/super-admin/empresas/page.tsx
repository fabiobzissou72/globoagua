'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, X, Building2, Loader2, Mail, MessageCircle, ChevronDown, MapPin, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

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
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
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

type ImportResult = { linha: number; status: 'ok' | 'erro'; razao_social: string; motivo?: string }

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['razao_social', 'nome_fantasia', 'cnpj', 'contato', 'email', 'faturado', 'prazo_faturamento', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'],
    ['Empresa Exemplo Ltda', 'Exemplo', '12345678000190', '11999999999', 'contato@exemplo.com', 'true', '30', '01310100', 'Av. Paulista', '1000', 'Sala 1', 'Bela Vista', 'São Paulo', 'SP'],
  ])
  ws['!cols'] = Array(14).fill({ wch: 20 })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Empresas')
  XLSX.writeFile(wb, 'modelo_importacao_empresas.xlsx')
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result
      const wb = XLSX.read(data, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (json.length === 0) { toast.error('Planilha vazia ou sem cabeçalhos válidos'); return }
      setRows(json)
      setStep('preview')
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/admin/import-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.results)
      setStep('results')
      if (data.ok > 0) onDone()
      toast.success(`${data.ok} empresa(s) importada(s)${data.erros > 0 ? `, ${data.erros} com erro` : ''}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro na importação')
    } finally {
      setImporting(false)
    }
  }

  function exportErrors() {
    const erros = results.filter(r => r.status === 'erro')
    const original = rows.filter((_, i) => erros.some(e => e.linha === i + 2))
    const withError = original.map((r, i) => ({ ...r, _erro: erros[i]?.motivo || '' }))
    const ws = XLSX.utils.json_to_sheet(withError)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Erros')
    XLSX.writeFile(wb, 'erros_importacao.xlsx')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-[#1565C0]" />
            Importar Empresas por Excel
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">

          {/* STEP: upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                <p className="font-semibold text-[#1565C0]">Colunas aceitas na planilha:</p>
                <p className="font-mono text-xs text-gray-500 leading-relaxed">
                  razao_social · nome_fantasia · cnpj · contato · email · faturado (true/false) · prazo_faturamento · cep · logradouro · numero · complemento · bairro · cidade · uf
                </p>
                <p className="text-xs text-gray-500 mt-1">• Upsert automático por CNPJ (evita duplicados)<br />• CNPJ/telefone normalizados automaticamente (remove máscara)</p>
              </div>
              <button onClick={downloadTemplate}
                className="btn-secondary w-full">
                <Download size={16} /> Baixar Modelo de Planilha
              </button>
              <label className="flex flex-col items-center gap-3 border-2 border-dashed border-[#1565C0] rounded-2xl p-8 cursor-pointer hover:bg-blue-50 transition-colors">
                <Upload size={32} className="text-[#1565C0]" />
                <div className="text-center">
                  <p className="font-semibold text-gray-800">Clique para selecionar o arquivo</p>
                  <p className="text-sm text-gray-500">.xlsx ou .xls</p>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
              </label>
            </div>
          )}

          {/* STEP: preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">{rows.length} empresa(s) encontrada(s)</p>
                <button onClick={() => { setRows([]); setStep('upload') }} className="text-xs text-gray-400 hover:underline">Trocar arquivo</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['razao_social', 'nome_fantasia', 'cnpj', 'email', 'faturado', 'cidade'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{row.razao_social || <span className="text-red-400">— vazio</span>}</td>
                        <td className="px-3 py-2 text-gray-600">{row.nome_fantasia || '—'}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">{row.cnpj || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{row.email || '—'}</td>
                        <td className="px-3 py-2">{String(row.faturado).toLowerCase() === 'true' ? <span className="text-[#1565C0] font-semibold">Sim</span> : '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{row.cidade || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && <p className="text-xs text-center text-gray-400 py-2">+ {rows.length - 20} linhas não exibidas</p>}
              </div>
            </div>
          )}

          {/* STEP: results */}
          {step === 'results' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-[#2E7D32]">{results.filter(r => r.status === 'ok').length}</p>
                  <p className="text-sm text-gray-600 font-medium">Importadas com sucesso</p>
                </div>
                <div className={`border rounded-xl p-4 text-center ${results.some(r => r.status === 'erro') ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-2xl font-black ${results.some(r => r.status === 'erro') ? 'text-red-600' : 'text-gray-400'}`}>{results.filter(r => r.status === 'erro').length}</p>
                  <p className="text-sm text-gray-600 font-medium">Com erro</p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${r.status === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {r.status === 'ok'
                      ? <CheckCircle size={14} className="text-[#2E7D32] shrink-0 mt-0.5" />
                      : <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-semibold text-gray-800">Linha {r.linha}: </span>
                      <span className="text-gray-600">{r.razao_social}</span>
                      {r.motivo && <p className="text-red-500">{r.motivo}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {results.some(r => r.status === 'erro') && (
                <button onClick={exportErrors} className="btn-secondary w-full">
                  <Download size={16} /> Exportar linhas com erro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t shrink-0">
          {step === 'preview' && (
            <button onClick={handleImport} disabled={importing} className="btn-primary w-full py-3">
              {importing
                ? <><Loader2 size={16} className="animate-spin" /> Importando {rows.length} empresas...</>
                : <><Upload size={16} /> Confirmar Importação ({rows.length} empresas)</>}
            </button>
          )}
          {step === 'results' && (
            <button onClick={onClose} className="btn-primary w-full py-3">Fechar</button>
          )}
          {step === 'upload' && (
            <button onClick={onClose} className="btn-secondary w-full py-3">Cancelar</button>
          )}
        </div>
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
  const [showImport, setShowImport] = useState(false)
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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <FileSpreadsheet size={16} /> Importar Excel
          </button>
          <button onClick={() => setModal({ open: true })} className="btn-primary">
            <Plus size={18} /> Nova Empresa
          </button>
        </div>
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
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onDone={loadCompanies} />
      )}
    </div>
  )
}
