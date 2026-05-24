'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'

interface Branch { id: string; nome: string; bairro: string; raio_km: number; taxa_entrega: number; prazo_min: number }

export default function FiliaisPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState({ nome: '', bairro: '', raio_km: 8, taxa_entrega: 0, prazo_min: 30 })
  const sb = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await sb.from('branches').select('id,nome,bairro,raio_km,taxa_entrega,prazo_min').order('nome')
    setBranches(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm({ nome: '', bairro: '', raio_km: 8, taxa_entrega: 0, prazo_min: 30 }); setEditing(null); setModal('create') }
  function openEdit(b: Branch) { setForm({ nome: b.nome, bairro: b.bairro || '', raio_km: b.raio_km || 8, taxa_entrega: b.taxa_entrega || 0, prazo_min: b.prazo_min || 30 }); setEditing(b); setModal('edit') }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return }
    const payload = { nome: form.nome.trim(), bairro: form.bairro, raio_km: form.raio_km, taxa_entrega: form.taxa_entrega, prazo_min: form.prazo_min }
    const { error } = editing
      ? await sb.from('branches').update(payload).eq('id', editing.id)
      : await sb.from('branches').insert(payload)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success(editing ? 'Filial atualizada!' : 'Filial criada!')
    setModal(null); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta filial?')) return
    await sb.from('branches').delete().eq('id', id)
    toast.success('Excluída'); load()
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Filiais</h1>
        <button onClick={openCreate} className="btn-primary gap-1.5 py-2.5 px-4 text-sm">
          <Plus size={16} /> <span className="hidden sm:inline">Nova Filial</span><span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-gray-400">Carregando...</div>
        ) : branches.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">Nenhuma filial cadastrada</div>
        ) : branches.map(b => (
          <div key={b.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <GitBranch size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{b.nome}</p>
                {b.bairro && <p className="text-xs text-gray-400">{b.bairro}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">Raio</p>
                <p className="font-semibold text-gray-700">{b.raio_km || 8}km</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">Taxa</p>
                <p className="font-semibold text-gray-700">R$ {(b.taxa_entrega || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">Prazo</p>
                <p className="font-semibold text-gray-700">{b.prazo_min || 30}min</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(b)} className="btn-secondary flex-1 py-1.5 text-xs gap-1">
                <Pencil size={12} /> Editar
              </button>
              <button onClick={() => handleDelete(b.id)} className="btn-danger py-1.5 px-4 text-xs">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Nome', 'Cobertura', 'Taxa/Prazo', 'Ações'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">Carregando...</td></tr>
                : branches.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">Nenhuma filial cadastrada</td></tr>
                : branches.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><GitBranch size={14} className="text-blue-600" /></div>
                      <div>
                        <div className="font-semibold text-gray-900">{b.nome}</div>
                        {b.bairro && <div className="text-xs text-gray-400">{b.bairro}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">Raio: {b.raio_km || 8}km</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">R$ {(b.taxa_entrega || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{b.prazo_min || 30} min</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="btn-secondary py-1.5 px-3 text-xs gap-1"><Pencil size={12} /> Editar</button>
                      <button onClick={() => handleDelete(b.id)} className="btn-danger py-1.5 px-3 text-xs"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{modal === 'create' ? 'Nova Filial' : 'Editar Filial'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome *</label>
                <input className="input-base" placeholder="Ex: ALAMEDA ITÚ" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Bairro / Região</label>
                <input className="input-base" placeholder="Ex: Bela Vista" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Raio (km)</label>
                  <input className="input-base" type="number" min="1" value={form.raio_km} onChange={e => setForm({...form, raio_km: Number(e.target.value)})} /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Taxa (R$)</label>
                  <input className="input-base" type="number" min="0" step="0.01" value={form.taxa_entrega} onChange={e => setForm({...form, taxa_entrega: Number(e.target.value)})} /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Prazo (min)</label>
                  <input className="input-base" type="number" min="1" value={form.prazo_min} onChange={e => setForm({...form, prazo_min: Number(e.target.value)})} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleSave} className="btn-primary flex-1">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
