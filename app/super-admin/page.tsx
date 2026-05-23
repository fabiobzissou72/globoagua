'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, DollarSign, Users, Package, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

type DayStat = { date: string; total: number; pedidos: number }
type StatusStat = { name: string; value: number; color: string }

const STATUS_COLORS: Record<string, string> = {
  NOVO: '#1976D2',
  CONFIRMADO: '#2E7D32',
  PRODUCAO: '#F57C00',
  EM_ROTA: '#7B1FA2',
  ENTREGUE: '#388E3C',
  CANCELADO: '#D32F2F',
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ pedidosHoje: 0, receitaHoje: 0, clientes: 0, produtos: 0 })
  const [lineData, setLineData] = useState<DayStat[]>([])
  const [pieData, setPieData] = useState<StatusStat[]>([])
  const [recentOrders, setRecentOrders] = useState<{ id: string; numero_pedido: string; cliente_nome: string; total: number; status: string; created_at: string }[]>([])

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    const [todayRes, clientsRes, productsRes, weekRes, statusRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total').gte('created_at', today),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'cliente'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('orders').select('created_at, total').gte('created_at', sevenDaysAgo).order('created_at'),
      supabase.from('orders').select('status'),
      supabase.from('orders').select('id, numero_pedido, cliente_nome, total, status, created_at').order('created_at', { ascending: false }).limit(10),
    ])

    setMetrics({
      pedidosHoje: todayRes.data?.length || 0,
      receitaHoje: todayRes.data?.reduce((s, o) => s + o.total, 0) || 0,
      clientes: clientsRes.count || 0,
      produtos: productsRes.count || 0,
    })

    // Group by day
    const dayMap: Record<string, { total: number; pedidos: number }> = {}
    weekRes.data?.forEach(o => {
      const day = o.created_at.split('T')[0]
      if (!dayMap[day]) dayMap[day] = { total: 0, pedidos: 0 }
      dayMap[day].total += o.total
      dayMap[day].pedidos++
    })
    setLineData(Object.entries(dayMap).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      ...v,
    })))

    // Status distribution
    const statusMap: Record<string, number> = {}
    statusRes.data?.forEach(o => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1
    })
    setPieData(Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || '#999',
    })))

    if (recentRes.data) setRecentOrders(recentRes.data)
    setLoading(false)
  }

  const metricCards = [
    { label: 'Pedidos hoje', value: metrics.pedidosHoje, icon: ShoppingCart, color: '#1565C0', bg: '#EFF6FF' },
    { label: 'Receita hoje', value: formatCurrency(metrics.receitaHoje), icon: DollarSign, color: '#2E7D32', bg: '#F0FDF4' },
    { label: 'Clientes', value: metrics.clientes, icon: Users, color: '#7B1FA2', bg: '#F5F3FF' },
    { label: 'Produtos ativos', value: metrics.produtos, icon: Package, color: '#F57C00', bg: '#FFF7ED' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral do sistema</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(card => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: card.bg }}>
                <card.icon size={22} style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-xl font-black mt-0.5" style={{ color: card.color }}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#1565C0]" />
            <h2 className="font-bold text-gray-900">Vendas — 7 dias</h2>
          </div>
          {lineData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} width={55} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="total" stroke="#1565C0" strokeWidth={2.5}
                  dot={{ fill: '#1565C0', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4">Status dos Pedidos</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Sem dados</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 capitalize">{d.name.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-bold text-gray-900">Últimos Pedidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nº Pedido', 'Cliente', 'Total', 'Status', 'Data'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-[#1565C0]">#{order.numero_pedido}</td>
                  <td className="px-4 py-3 font-medium">{order.cliente_nome}</td>
                  <td className="px-4 py-3 font-bold text-[#2E7D32]">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
