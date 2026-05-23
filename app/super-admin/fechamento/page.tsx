'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

type Order = {
  id: string
  numero_pedido: string
  cliente_nome: string
  total: number
  status: string
  metodo_pagamento: string
  created_at: string
  branch_id?: string
  driver_id?: string
}

type Branch = { id: string; nome: string }

const STATUSES = ['NOVO', 'CONFIRMADO', 'PRODUCAO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO']

export default function FechamentoPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [drivers, setDrivers] = useState<{ id: string; nome_completo?: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [filterStatus, setFilterStatus] = useState('ENTREGUE')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterDriver, setFilterDriver] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMeta()
    const today = new Date().toISOString().split('T')[0]
    setDateFrom(today)
    setDateTo(today)
  }, [])

  useEffect(() => { loadOrders() }, [filterStatus, filterBranch, filterDriver, dateFrom, dateTo, search])

  async function loadMeta() {
    const supabase = createClient()
    const [bRes, dRes] = await Promise.all([
      supabase.from('branches').select('id, nome').order('nome'),
      supabase.from('profiles').select('id, nome_completo').eq('role', 'entregador'),
    ])
    if (bRes.data) setBranches(bRes.data)
    if (dRes.data) setDrivers(dRes.data)
  }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filterStatus) q = q.eq('status', filterStatus)
    if (filterBranch) q = q.eq('branch_id', filterBranch)
    if (filterDriver) q = q.eq('driver_id', filterDriver)
    if (dateFrom) q = q.gte('created_at', dateFrom)
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
    if (search) q = q.or(`cliente_nome.ilike.%${search}%,numero_pedido.ilike.%${search}%`)
    const { data } = await q.limit(500)
    if (data) setOrders(data)
    setLoading(false)
  }, [filterStatus, filterBranch, filterDriver, dateFrom, dateTo, search])

  const exportCSV = () => {
    const headers = ['Nº Pedido', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data']
    const rows = orders.map(o => [
      o.numero_pedido,
      o.cliente_nome,
      o.total.toFixed(2),
      o.metodo_pagamento,
      o.status,
      formatDate(o.created_at),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fechamento_${dateFrom}_${dateTo}.csv`
    a.click()
  }

  const totalValue = orders.reduce((s, o) => s + o.total, 0)

  type ClientGroup = { nome: string; orders: Order[]; total: number }
  const grouped: Record<string, ClientGroup> = {}
  orders.forEach(o => {
    if (!grouped[o.cliente_nome]) grouped[o.cliente_nome] = { nome: o.cliente_nome, orders: [], total: 0 }
    grouped[o.cliente_nome].orders.push(o)
    grouped[o.cliente_nome].total += o.total
  })
  const groupedList = Object.values(grouped).sort((a, b) => b.total - a.total)

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fechamento</h1>
          <p className="text-sm text-gray-500">{orders.length} pedidos · Total: {formatCurrency(totalValue)}</p>
        </div>
        <button onClick={exportCSV} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="card p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
          <option value="">Todos entregadores</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.nome_completo}</option>)}
        </select>
        <div className="flex gap-2 lg:col-span-1">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-base py-2 text-sm flex-1" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-base py-2 text-sm flex-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total geral', value: formatCurrency(totalValue), color: '#1565C0' },
          { label: 'Pedidos', value: orders.length, color: '#1565C0' },
          { label: 'PIX', value: formatCurrency(orders.filter(o => o.metodo_pagamento?.toLowerCase() === 'pix').reduce((s, o) => s + o.total, 0)), color: '#2E7D32' },
          { label: 'Dinheiro', value: formatCurrency(orders.filter(o => o.metodo_pagamento?.toLowerCase() === 'dinheiro').reduce((s, o) => s + o.total, 0)), color: '#F57C00' },
        ].map(card => (
          <div key={card.label} className="card p-4">
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            <p className="text-xl font-black mt-1" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : groupedList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Nenhum pedido no período</div>
        ) : (
          <div className="divide-y">
            {groupedList.map(group => (
              <div key={group.nome} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{group.nome}</p>
                    <p className="text-xs text-gray-500">{group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-lg font-black text-[#1565C0]">{formatCurrency(group.total)}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left py-1 pr-3">Pedido</th>
                        <th className="text-left py-1 pr-3">Status</th>
                        <th className="text-left py-1 pr-3">Pagamento</th>
                        <th className="text-right py-1 pr-3">Valor</th>
                        <th className="text-left py-1">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.orders.map(order => (
                        <tr key={order.id} className="border-t border-gray-50">
                          <td className="py-1 pr-3 font-mono text-[#1565C0] font-bold">#{order.numero_pedido}</td>
                          <td className="py-1 pr-3">
                            <span className={`badge badge-${order.status?.toLowerCase()} text-xs`}>{order.status}</span>
                          </td>
                          <td className="py-1 pr-3 capitalize">{order.metodo_pagamento}</td>
                          <td className="py-1 pr-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                          <td className="py-1 text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
