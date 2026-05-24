'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Eye, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Order = {
  id: string
  numero_pedido: string
  cliente_nome: string
  cpf_cnpj?: string
  total: number
  branch_id?: string
  filial_nome?: string
  prioridade: string
  driver_id?: string
  status: string
  metodo_pagamento: string
  created_at: string
  endereco_completo?: string
  observations?: string
  cliente_whatsapp?: string
  recebedor_nome?: string
  entregue_em?: string
}

type Branch = { id: string; nome: string }
type Driver = { id: string; nome_completo?: string; email?: string }

const STATUSES = ['NOVO', 'CONFIRMADO', 'PRODUCAO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO']
const PRIORITIES = ['NORMAL', 'ALTA', 'URGENTE']
const PER_PAGE = 50

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>
}

function OrderDetailModal({ order, branches, drivers, onClose, onStatusChange }: {
  order: Order
  branches: Branch[]
  drivers: Driver[]
  onClose: () => void
  onStatusChange: () => void
}) {
  const [items, setItems] = useState<{ produto_nome: string; quantidade: number; preco_unitario: number; subtotal: number }[]>([])
  const [status, setStatus] = useState(order.status)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('order_items').select('*').eq('order_id', order.id).then(({ data }) => {
      if (data) setItems(data)
    })
  }, [order.id])

  const handleStatus = async (s: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: s }).eq('id', order.id)
    setStatus(s)
    onStatusChange()
    toast.success(`Status: ${s}`)
  }

  const branchName = order.filial_nome || branches.find(b => b.id === order.branch_id)?.nome || '—'
  const driverName = drivers.find(d => d.id === order.driver_id)?.nome_completo || '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Pedido #{order.numero_pedido}</h2>
            <StatusBadge status={status} />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Cliente</p>
              <p className="font-semibold mt-0.5">{order.cliente_nome}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="font-bold text-lg text-[#1565C0]">{formatCurrency(order.total)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Filial</p>
              <p className="font-semibold mt-0.5">{branchName}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Entregador</p>
              <p className="font-semibold mt-0.5">{driverName}</p>
            </div>
          </div>

          {order.endereco_completo && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Endereço</p>
              <p>{order.endereco_completo}</p>
            </div>
          )}

          {order.entregue_em && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 font-medium">Entregue em</p>
                <p className="font-semibold text-[#2E7D32]">{new Date(order.entregue_em).toLocaleString('pt-BR', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' })}</p>
              </div>
              {order.recebedor_nome && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">Recebido por</p>
                  <p className="font-semibold text-gray-800">{order.recebedor_nome}</p>
                </div>
              )}
            </div>
          )}

          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Itens</p>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Produto</th>
                      <th className="text-center p-2 font-semibold text-gray-600">Qtd</th>
                      <th className="text-right p-3 font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3">{item.produto_nome}</td>
                        <td className="p-2 text-center">{item.quantidade}</td>
                        <td className="p-3 text-right">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Status flow buttons */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Alterar Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s}
                onClick={() => handleStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2
                  ${status === s ? 'bg-[#1565C0] text-white border-[#1565C0]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#1565C0]'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterDriver, setFilterDriver] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')
  const loadOrdersRef = useRef<() => void>(() => {})

  useEffect(() => {
    loadMeta()
    const supabase = createClient()
    const channel = supabase
      .channel('admin-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrdersRef.current())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [page, filterStatus, filterBranch, filterDriver, filterDate, search])

  async function loadMeta() {
    const supabase = createClient()
    const [branchesRes, driversRes] = await Promise.all([
      supabase.from('branches').select('id, nome').order('nome'),
      supabase.from('profiles').select('id, nome_completo').eq('role', 'entregador'),
    ])
    if (branchesRes.data) setBranches(branchesRes.data)
    if (driversRes.data) setDrivers(driversRes.data)
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('orders').select('*', { count: 'exact' })
    if (filterStatus) q = q.eq('status', filterStatus)
    if (filterBranch) q = q.eq('branch_id', filterBranch)
    if (filterDriver) q = q.eq('driver_id', filterDriver)
    if (filterDate) q = q.gte('created_at', filterDate).lt('created_at', filterDate + 'T23:59:59')
    if (search) q = q.or(`cliente_nome.ilike.%${search}%,numero_pedido.ilike.%${search}%`)
    q = q.order('created_at', { ascending: false }).range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)
    const { data, count } = await q
    if (data) setOrders(data)
    if (count !== null) setTotal(count)
    setLoading(false)
  }, [page, filterStatus, filterBranch, filterDriver, filterDate, search])

  useEffect(() => { loadOrdersRef.current = loadOrders }, [loadOrders])

  const updateOrderField = async (orderId: string, field: string, value: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ [field]: value }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o))
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500">{total} pedido{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative lg:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-base pl-9 py-2 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-base py-2 text-sm">
          <option value="">Todos os status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="input-base py-2 text-sm">
          <option value="">Todas as filiais</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
        </select>
        <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)} className="input-base py-2 text-sm">
          <option value="">Todos os entregadores</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.nome_completo || d.email}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-base py-2 text-sm" />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : orders.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">Nenhum pedido encontrado</div>
        ) : orders.map(order => (
          <div key={order.id} className="card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-[#1565C0] font-mono">#{order.numero_pedido}</p>
                <p className="font-semibold text-gray-900 mt-0.5">{order.cliente_nome}</p>
                <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-[#2E7D32] text-lg">{formatCurrency(order.total)}</p>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Filial</p>
                <select value={order.branch_id || ''} onChange={e => updateOrderField(order.id, 'branch_id', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="">—</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Entregador</p>
                <select value={order.driver_id || ''} onChange={e => updateOrderField(order.id, 'driver_id', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="">—</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.nome_completo || d.email}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <select value={order.status} onChange={e => updateOrderField(order.id, 'status', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Prioridade</p>
                <select value={order.prioridade} onChange={e => updateOrderField(order.id, 'prioridade', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => setSelectedOrder(order)} className="btn-secondary w-full text-sm py-2">
              <Eye size={14} /> Ver detalhes
            </button>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nº', 'Cliente', 'Total', 'Filial', 'Prioridade', 'Entregador', 'Status', 'Data', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Nenhum pedido encontrado</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#1565C0] whitespace-nowrap">#{order.numero_pedido}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap max-w-32 truncate">{order.cliente_nome}</td>
                  <td className="px-4 py-3 font-bold text-[#2E7D32] whitespace-nowrap">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <select value={order.branch_id || ''} onChange={e => updateOrderField(order.id, 'branch_id', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      <option value="">—</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={order.prioridade} onChange={e => updateOrderField(order.id, 'prioridade', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={order.driver_id || ''} onChange={e => updateOrderField(order.id, 'driver_id', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      <option value="">—</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.nome_completo || d.email}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={order.status} onChange={e => updateOrderField(order.id, 'status', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedOrder(order)} className="btn-secondary text-xs py-1.5 px-3">
                      <Eye size={14} /> Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-2 card">
          <p className="text-sm text-gray-500">Página {page + 1} de {totalPages} · {total} registros</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          branches={branches}
          drivers={drivers}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={loadOrders}
        />
      )}
    </div>
  )
}
