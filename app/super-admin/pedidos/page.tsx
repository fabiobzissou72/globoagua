'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['NOVO','CONFIRMADO','PRODUCAO','EM_ROTA','ENTREGUE','CANCELADO']
const STATUS_COLORS: Record<string,string> = {
  NOVO:'badge-novo', CONFIRMADO:'badge-confirmado', PRODUCAO:'badge-producao',
  EM_ROTA:'badge-em_rota', ENTREGUE:'badge-entregue', CANCELADO:'badge-cancelado',
}

export default function SuperAdminPedidosPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [selected, setSelected] = useState<any>(null)
  const [page, setPage] = useState(0)
  const PER_PAGE = 50

  const sb = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: ordersData }, { data: driversData }, { data: branchesData }] = await Promise.all([
      sb.from('orders').select('*').order('created_at', { ascending: false }).range(page * PER_PAGE, (page + 1) * PER_PAGE - 1),
      sb.from('profiles').select('id, nome_completo').eq('role','entregador'),
      sb.from('branches').select('id, nome'),
    ])
    setOrders(ordersData || [])
    setDrivers(driversData || [])
    setBranches(branchesData || [])
    setLoading(false)
  }, [page])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const channel = sb.channel('super-admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadData)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [])

  async function updateOrder(id: string, field: string, value: string) {
    const { error } = await sb.from('orders').update({ [field]: value }).eq('id', id)
    if (error) toast.error('Erro ao atualizar')
    else { toast.success('Atualizado'); loadData() }
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'Todos' || o.status === filterStatus
    const matchSearch = !search || o.numero_pedido?.includes(search) || o.cliente_nome?.toLowerCase().includes(search.toLowerCase())
    const matchDate = !filterDate || o.created_at?.startsWith(filterDate)
    return matchStatus && matchSearch && matchDate
  })

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pedidos</h1>
        <button onClick={loadData} className="btn-secondary py-2 px-4 text-sm gap-1.5">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <select className="input-base w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option>Todos</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="input-base w-auto" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-base pl-9" placeholder="Buscar por nº pedido ou nome" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {['Nº','Cliente','CPF/CNPJ','Total','Filial','Prioridade','Entregador','Status','Data','Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400">Nenhum pedido encontrado</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-blue-600 font-semibold">#{o.numero_pedido}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{o.cliente_nome}</div>
                  <div className="text-gray-400 text-xs">{o.cliente_whatsapp}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">{o.cliente_documento}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <select className="text-xs border border-gray-200 rounded-lg px-2 py-1" value={o.branch_id || ''} onChange={e => updateOrder(o.id, 'branch_id', e.target.value)}>
                    <option value="">—</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="text-xs border border-gray-200 rounded-lg px-2 py-1" value={o.prioridade || 'NORMAL'} onChange={e => updateOrder(o.id, 'prioridade', e.target.value)}>
                    <option>NORMAL</option><option>ALTA</option><option>URGENTE</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="text-xs border border-gray-200 rounded-lg px-2 py-1" value={o.driver_id || ''} onChange={e => updateOrder(o.id, 'driver_id', e.target.value)}>
                    <option value="">Sem entregador</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.nome_completo}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className={`badge ${STATUS_COLORS[o.status] || 'badge-novo'} border-0 text-xs font-bold cursor-pointer`} value={o.status} onChange={e => updateOrder(o.id, 'status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setSelected(o)}>Detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-600">Pedido #{selected.numero_pedido}</h2>
              <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Data/Hora:</span><div className="font-medium">{formatDate(selected.created_at)}</div></div>
                <div><span className="text-gray-500">Status:</span><div><span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div></div>
                <div><span className="text-gray-500">Pagamento:</span><div className="font-medium">{selected.metodo_pagamento}</div></div>
                <div><span className="text-gray-500">Total:</span><div className="font-bold text-lg text-green-600">{formatCurrency(selected.total)}</div></div>
              </div>
              <div className="border rounded-xl p-4">
                <h3 className="font-semibold mb-2">Cliente</h3>
                <div className="space-y-1 text-gray-600">
                  <div><b>Nome:</b> {selected.cliente_nome}</div>
                  <div><b>WhatsApp:</b> {selected.cliente_whatsapp}</div>
                  <div><b>Endereço:</b> {selected.endereco_completo}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => updateOrder(selected.id, 'status', s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selected.status === s ? `${STATUS_COLORS[s]} ring-2 ring-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
