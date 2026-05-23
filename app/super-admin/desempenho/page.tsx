'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, TrendingUp, Package, XCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type DriverStat = {
  driver_id: string
  driver_name: string
  entregas: number
  cancelamentos: number
  total_pedidos: number
  taxa: number
}

export default function DesempenhoPage() {
  const [stats, setStats] = useState<DriverStat[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setDateFrom(today)
    setDateTo(today)
  }, [])

  const loadStats = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    const supabase = createClient()

    const [driversRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('id, nome_completo, email').eq('role', 'entregador'),
      supabase.from('orders')
        .select('driver_id, status')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59'),
    ])

    const driversData = driversRes.data || []
    const ordersData = ordersRes.data || []

    const statsMap: Record<string, DriverStat> = {}
    driversData.forEach((d: { id: string; nome_completo?: string; email?: string }) => {
      statsMap[d.id] = { driver_id: d.id, driver_name: d.nome_completo || d.email || 'Entregador', entregas: 0, cancelamentos: 0, total_pedidos: 0, taxa: 0 }
    })

    ordersData.forEach((order: { driver_id?: string; status: string }) => {
      if (!order.driver_id || !statsMap[order.driver_id]) return
      statsMap[order.driver_id].total_pedidos++
      if (order.status === 'ENTREGUE') statsMap[order.driver_id].entregas++
      if (order.status === 'CANCELADO') statsMap[order.driver_id].cancelamentos++
    })

    Object.values(statsMap).forEach(s => {
      s.taxa = s.total_pedidos > 0 ? Math.round((s.entregas / s.total_pedidos) * 100) : 0
    })

    setStats(Object.values(statsMap).filter(s => s.total_pedidos > 0).sort((a, b) => b.entregas - a.entregas))
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { loadStats() }, [loadStats])

  const setRange = (range: 'hoje' | 'semana' | 'mes') => {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const today = fmt(now)
    if (range === 'hoje') { setDateFrom(today); setDateTo(today) }
    else if (range === 'semana') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      setDateFrom(fmt(start)); setDateTo(today)
    } else {
      setDateFrom(fmt(new Date(now.getFullYear(), now.getMonth(), 1))); setDateTo(today)
    }
  }

  const totalEntregas = stats.reduce((s, d) => s + d.entregas, 0)
  const totalCancelamentos = stats.reduce((s, d) => s + d.cancelamentos, 0)
  const totalPedidos = stats.reduce((s, d) => s + d.total_pedidos, 0)

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Desempenho de Entregadores</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {(['hoje', 'semana', 'mes'] as const).map(range => (
          <button key={range} onClick={() => setRange(range)} className="btn-secondary py-1.5 px-4 text-sm capitalize">
            {range === 'hoje' ? 'Hoje' : range === 'semana' ? 'Esta semana' : 'Este mês'}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-base py-1.5 text-sm w-36" />
          <span className="text-gray-400">até</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-base py-1.5 text-sm w-36" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total entregues', value: totalEntregas, icon: TrendingUp, color: '#2E7D32' },
          { label: 'Cancelamentos', value: totalCancelamentos, icon: XCircle, color: '#D32F2F' },
          { label: 'Total pedidos', value: totalPedidos, icon: Package, color: '#1565C0' },
          { label: 'Entregadores ativos', value: stats.length, icon: Users, color: '#F57C00' },
        ].map(card => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={18} style={{ color: card.color }} />
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : stats.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Nenhum dado no período</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Entregador', 'Entregas', 'Cancelamentos', 'Total pedidos', 'Taxa de entrega'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.map(driver => (
                  <tr key={driver.driver_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{driver.driver_name}</td>
                    <td className="px-4 py-3 font-bold text-[#2E7D32]">{driver.entregas}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${driver.cancelamentos > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {driver.cancelamentos}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{driver.total_pedidos}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                          <div className="h-2 rounded-full transition-all" style={{
                            width: `${driver.taxa}%`,
                            backgroundColor: driver.taxa >= 90 ? '#2E7D32' : driver.taxa >= 70 ? '#F57C00' : '#D32F2F',
                          }} />
                        </div>
                        <span className={`font-bold text-sm ${driver.taxa >= 90 ? 'text-[#2E7D32]' : driver.taxa >= 70 ? 'text-orange-500' : 'text-red-500'}`}>
                          {driver.taxa}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
