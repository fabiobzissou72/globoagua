'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Truck, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface Driver {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  online?: boolean
  updated_at?: string
}

export default function EntregadoresPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [locations, setLocations] = useState<Record<string, { updated_at: string }>>({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState({ nome_completo: '', telefone: '', senha: '' })
  const sb = createClient()

  const load = async () => {
    setLoading(true)
    const [{ data: driversData }, { data: locsData }] = await Promise.all([
      sb.from('profiles').select('id, nome_completo, email, telefone').eq('role', 'entregador').order('nome_completo'),
      sb.from('driver_locations').select('driver_id, updated_at'),
    ])
    setDrivers(driversData || [])
    const locsMap: Record<string, { updated_at: string }> = {}
    ;(locsData || []).forEach((l: { driver_id: string; updated_at: string }) => { locsMap[l.driver_id] = l })
    setLocations(locsMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function isOnline(driverId: string) {
    const loc = locations[driverId]
    if (!loc) return false
    return (Date.now() - new Date(loc.updated_at).getTime()) < 10 * 60 * 1000
  }

  function openCreate() {
    setForm({ nome_completo: '', telefone: '', senha: 'GloboAgua@entregador' })
    setEditing(null)
    setModal('create')
  }

  function openEdit(d: Driver) {
    setForm({ nome_completo: d.nome_completo || '', telefone: d.telefone || '', senha: '' })
    setEditing(d)
    setModal('edit')
  }

  async function handleSave() {
    if (!form.nome_completo.trim()) { toast.error('Nome obrigatório'); return }
    if (!editing && !form.telefone.trim()) { toast.error('Telefone obrigatório'); return }

    if (editing) {
      const { error } = await sb.from('profiles').update({
        nome_completo: form.nome_completo.trim(),
        telefone: form.telefone.trim(),
      }).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar'); return }
      toast.success('Entregador atualizado!')
    } else {
      const phone = form.telefone.replace(/\D/g, '')
      const email = `entregador_${phone}@entrega.globoagua.app`
      const res = await fetch('/api/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: form.nome_completo.trim(),
          telefone: phone,
          email,
          senha: form.senha || 'GloboAgua@entregador',
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { toast.error(json.error || 'Erro ao criar entregador'); return }
      toast.success('Entregador criado!')
    }
    setModal(null)
    load()
  }

  async function handleDelete(d: Driver) {
    if (!confirm(`Excluir ${d.nome_completo}?`)) return
    await sb.from('profiles').delete().eq('id', d.id)
    toast.success('Excluído')
    load()
  }

  const online = drivers.filter(d => isOnline(d.id)).length

  return (
    <div className="p-4 md:p-6 w-full max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Entregadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {drivers.length} cadastrados · <span className="text-green-600 font-semibold">{online} online</span>
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-1.5 py-2.5 px-4 text-sm">
          <Plus size={16} /> Novo Entregador
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nome','Telefone','Status','Ações'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center text-gray-400">Carregando...</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-gray-400">Nenhum entregador cadastrado</td></tr>
            ) : drivers.map(d => {
              const online = isOnline(d.id)
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{d.nome_completo}</div>
                        <div className="text-xs text-gray-400">{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{d.telefone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="btn-secondary py-1.5 px-3 text-xs gap-1">
                        <Pencil size={12} /> Editar
                      </button>
                      <button onClick={() => handleDelete(d)} className="btn-danger py-1.5 px-3 text-xs">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{modal === 'create' ? 'Novo Entregador' : 'Editar Entregador'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo *</label>
                <input className="input-base" placeholder="Ex: João Silva" value={form.nome_completo}
                  onChange={e => setForm({ ...form, nome_completo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Telefone {modal === 'create' && '*'} <span className="text-xs text-gray-400 font-normal">(usado como login)</span>
                </label>
                <input className="input-base" placeholder="11999999999" value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  disabled={modal === 'edit'} />
              </div>
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
                  <input className="input-base" placeholder="GloboAgua@entregador" value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })} />
                </div>
              )}
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
