'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin, Navigation, CheckCircle, XCircle, Eye, ArrowUp, ArrowDown,
  Save, Bell, BellOff, Lock, LogOut, X, User, Loader2, History, List
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Order = {
  id: string
  numero_pedido: string
  cliente_nome: string
  endereco_completo: string
  total: number
  status: string
  prioridade: string
  metodo_pagamento: string
  branch_id?: string
  observacoes?: string
  cliente_whatsapp?: string
  fila_posicao?: number
  entregue_em?: string
  recebedor_nome?: string
}

type OrderItem = {
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMADO: '#1565C0',
  EM_ROTA: '#7B1FA2',
  ENTREGUE: '#2E7D32',
  CANCELADO: '#D32F2F',
  NOVO: '#F57C00',
}

function PriorityBadge({ priority }: { priority: string }) {
  const isHigh = priority === 'ALTA' || priority === 'URGENTE'
  return (
    <span className={`badge ${isHigh ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
      {isHigh ? '🔥 ALTA' : 'NORMAL'}
    </span>
  )
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [newPass, setNewPass] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = async () => {
    if (newPass.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) toast.error(error.message)
    else { toast.success('Senha alterada!'); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Alterar Senha</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={newPass}
          onChange={e => setNewPass(e.target.value)} className="input-base" />
        <button onClick={handleChange} disabled={saving} className="btn-primary w-full mt-4 py-3">
          {saving ? 'Salvando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose, onStatusChange }: {
  order: Order
  onClose: () => void
  onStatusChange: (id: string, status: string, extra?: { recebedor_nome?: string; observacoes?: string; entregue_em?: string }) => void
}) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [receivedBy, setReceivedBy] = useState(order.recebedor_nome || order.cliente_nome)
  const [obs, setObs] = useState(order.observacoes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadItems() }, [order.id])

  async function loadItems() {
    const supabase = createClient()
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    if (data) setItems(data)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('orders').update({ observacoes: obs }).eq('id', order.id)
    toast.success('Salvo!')
    setSaving(false)
  }

  const handleStatusChange = async (status: string) => {
    const extra: { recebedor_nome?: string; observacoes?: string; entregue_em?: string } = {
      recebedor_nome: receivedBy,
      observacoes: obs,
    }
    if (status === 'ENTREGUE') {
      extra.entregue_em = new Date().toISOString()
    }
    onStatusChange(order.id, status, extra)
    onClose()
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Pedido #{order.numero_pedido}</h2>
            <p className="text-sm text-gray-500">{order.cliente_nome}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Payment highlight */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Valor a cobrar</p>
            <p className="text-3xl font-black text-[#2E7D32]">{formatCurrency(order.total)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.metodo_pagamento === 'pix' ? '⚡ PIX' :
                order.metodo_pagamento === 'cartao' ? '💳 Cartão' :
                order.metodo_pagamento === 'faturado' ? '📋 Faturado' : '💵 Dinheiro'}
            </p>
          </div>

          {/* Address */}
          <div className="card p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Endereço</p>
            <p className="text-sm text-gray-800">{order.endereco_completo}</p>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Itens</p>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Produto</th>
                      <th className="text-center p-3 font-semibold text-gray-600">Qtd</th>
                      <th className="text-right p-3 font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-3">{item.produto_nome}</td>
                        <td className="p-3 text-center">{item.quantidade}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recipient + timestamp */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirmação de entrega</p>
            <p className="text-xs text-gray-500">📅 {dateStr} às {timeStr}</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Recebido por</label>
              <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} className="input-base" />
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} className="input-base resize-none" />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-secondary w-full">
            {saving ? 'Salvando...' : <><Save size={16} /> Salvar observações</>}
          </button>
        </div>

        {/* Status Actions */}
        <div className="p-4 border-t bg-gray-50 grid grid-cols-3 gap-2">
          <button onClick={() => handleStatusChange('EM_ROTA')}
            className="flex flex-col items-center gap-1 py-2 px-2 bg-purple-100 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-200">
            <Navigation size={18} /> Em Rota
          </button>
          <button onClick={() => handleStatusChange('ENTREGUE')}
            className="flex flex-col items-center gap-1 py-2 px-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold hover:bg-green-200">
            <CheckCircle size={18} /> Entregue
          </button>
          <button onClick={() => handleStatusChange('CANCELADO')}
            className="flex flex-col items-center gap-1 py-2 px-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200">
            <XCircle size={18} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EntregadorPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [delivered, setDelivered] = useState<Order[]>([])
  const [tab, setTab] = useState<'fila' | 'historico'>('fila')
  const [loading, setLoading] = useState(true)
  const [driverName, setDriverName] = useState('')
  const [driverId, setDriverId] = useState('')
  const [alertOn, setAlertOn] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [savingQueue, setSavingQueue] = useState(false)
  const gpsInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeChannel = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ordersRef = useRef<Order[]>([])

  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    }
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('click', unlock, { once: true })

    const supabase = createClient()
    init(supabase)
    return () => {
      if (gpsInterval.current) clearInterval(gpsInterval.current)
      if (realtimeChannel.current) supabase.removeChannel(realtimeChannel.current)
    }
  }, [])

  function playAlert() {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const notes = [880, 1100]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.4, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
      osc.start(start)
      osc.stop(start + 0.25)
    })
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
  }

  async function init(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('nome_completo').eq('id', user.id).single()
    setDriverName(profile?.nome_completo || user.email || 'Entregador')
    setDriverId(user.id)

    await loadOrders(user.id)
    await loadDelivered(user.id)
    startGPS(user.id, profile?.nome_completo || '')
    subscribeToOrders(supabase, user.id)
    setLoading(false)
  }

  async function loadOrders(uid: string, checkNew = false) {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('driver_id', uid)
      .in('status', ['CONFIRMADO', 'EM_ROTA'])
      .order('fila_posicao', { ascending: true, nullsFirst: false })
    const newOrders = data || []
    if (checkNew) {
      const prevIds = new Set(ordersRef.current.map(o => o.id))
      const hasNew = newOrders.some(o => !prevIds.has(o.id))
      if (hasNew && alertOn) {
        playAlert()
        toast('🔔 Novo pedido chegou!', { duration: 5000 })
      }
    }
    ordersRef.current = newOrders
    setOrders(newOrders)
  }

  async function loadDelivered(uid: string) {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('driver_id', uid)
      .eq('status', 'ENTREGUE')
      .gte('entregue_em', today)
      .order('entregue_em', { ascending: false })
    setDelivered(data || [])
  }

  function subscribeToOrders(supabase: ReturnType<typeof createClient>, uid: string) {
    realtimeChannel.current = supabase
      .channel('driver-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders(uid, true)
        loadDelivered(uid)
      })
      .subscribe()
  }

  function startGPS(uid: string, name: string) {
    if (!navigator.geolocation) return
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(async pos => {
        const supabase = createClient()
        await supabase.from('driver_locations').upsert({
          driver_id: uid,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updated_at: new Date().toISOString(),
          driver_name: name,
        })
      }, undefined, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
    }
    sendLocation()
    gpsInterval.current = setInterval(sendLocation, 15000)
  }

  async function handleStatusChange(id: string, status: string, extra?: { recebedor_nome?: string; observacoes?: string; entregue_em?: string }) {
    const supabase = createClient()
    await supabase.from('orders').update({ status, ...extra }).eq('id', id)
    if (status === 'ENTREGUE') {
      try {
        await fetch('/api/notifications/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: id }),
        })
      } catch {}
      loadDelivered(driverId)
    }
    toast.success(`Status: ${status}`)
    setOrders(prev => prev.filter(o => !['ENTREGUE', 'CANCELADO'].includes(status) || o.id !== id)
      .map(o => o.id === id ? { ...o, status } : o))
  }

  async function saveQueue() {
    setSavingQueue(true)
    const supabase = createClient()
    try {
      await Promise.all(
        orders.map((o, idx) =>
          supabase.from('orders').update({ fila_posicao: idx + 1 }).eq('id', o.id)
        )
      )
      toast.success('Ordem salva!')
    } catch {
      toast.error('Erro ao salvar ordem')
    }
    setSavingQueue(false)
  }

  const moveOrder = (idx: number, dir: 'up' | 'down') => {
    setOrders(prev => {
      const arr = [...prev]
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= arr.length) return arr
      ;[arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]]
      return arr
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 size={32} className="animate-spin text-[#1565C0]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1565C0] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">{driverName}</p>
              <p className="text-blue-200 text-xs">Entregador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAlertOn(!alertOn)}
              className={`p-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${alertOn ? 'bg-green-500 text-white' : 'bg-white/20 text-white'}`}>
              {alertOn ? <Bell size={16} /> : <BellOff size={16} />}
              <span className="text-xs">{alertOn ? 'ON' : 'OFF'}</span>
            </button>
            <button onClick={() => setShowPasswordModal(true)}
              className="p-2 bg-white/20 text-white rounded-xl hover:bg-white/30">
              <Lock size={16} />
            </button>
            <button onClick={handleLogout}
              className="p-2 bg-white/20 text-white rounded-xl hover:bg-white/30">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[57px] z-30">
        <div className="max-w-lg mx-auto flex">
          <button onClick={() => setTab('fila')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-all ${tab === 'fila' ? 'border-[#1565C0] text-[#1565C0]' : 'border-transparent text-gray-400'}`}>
            <List size={15} /> Fila ({orders.length})
          </button>
          <button onClick={() => setTab('historico')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-all ${tab === 'historico' ? 'border-[#2E7D32] text-[#2E7D32]' : 'border-transparent text-gray-400'}`}>
            <History size={15} /> Hoje ({delivered.length})
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Fila */}
        {tab === 'fila' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Fila de Entrega</h1>
                <p className="text-sm text-gray-500">{orders.length} pedido{orders.length !== 1 ? 's' : ''} pendente{orders.length !== 1 ? 's' : ''}</p>
              </div>
              {orders.length > 0 && (
                <button onClick={saveQueue} disabled={savingQueue} className="btn-secondary text-sm py-2">
                  {savingQueue ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar ordem
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <CheckCircle size={48} strokeWidth={1} className="mx-auto mb-3" />
                <p className="font-semibold text-lg">Tudo entregue!</p>
                <p className="text-sm">Nenhum pedido pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order, idx) => (
                  <div key={order.id} className="card p-4 animate-slide-up">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 mt-1">
                        <button onClick={() => moveOrder(idx, 'up')} disabled={idx === 0}
                          className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center disabled:opacity-30">
                          <ArrowUp size={14} />
                        </button>
                        <div className="w-7 h-7 bg-[#1565C0] text-white rounded-lg flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </div>
                        <button onClick={() => moveOrder(idx, 'down')} disabled={idx === orders.length - 1}
                          className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center disabled:opacity-30">
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900">#{order.numero_pedido}</p>
                            <p className="text-sm text-gray-700 font-medium">{order.cliente_nome}</p>
                          </div>
                          <PriorityBadge priority={order.prioridade} />
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                          <MapPin size={13} />
                          <p className="text-xs truncate">{order.endereco_completo}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="badge"
                              style={{ background: `${STATUS_COLORS[order.status]}15`, color: STATUS_COLORS[order.status] }}>
                              {order.status.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-bold text-[#2E7D32]">{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                      <button onClick={() => setSelectedOrder(order)}
                        className="flex flex-col items-center gap-1 py-2 bg-blue-50 text-[#1565C0] rounded-xl text-xs font-semibold hover:bg-blue-100">
                        <Eye size={16} /> Detalhes
                      </button>
                      <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.endereco_completo)}`, '_blank')}
                        className="flex flex-col items-center gap-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100">
                        <Navigation size={16} /> Rota
                      </button>
                      <button onClick={() => handleStatusChange(order.id, 'EM_ROTA')}
                        className="flex flex-col items-center gap-1 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100">
                        <Navigation size={16} /> Em Rota
                      </button>
                      <button onClick={() => setSelectedOrder(order)}
                        className="flex flex-col items-center gap-1 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100">
                        <CheckCircle size={16} /> Entregue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Histórico do dia */}
        {tab === 'historico' && (
          <>
            <div className="mb-4">
              <h1 className="text-lg font-bold text-gray-900">Entregas de Hoje</h1>
              <p className="text-sm text-gray-500">{delivered.length} entregue{delivered.length !== 1 ? 's' : ''}</p>
            </div>

            {delivered.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <History size={48} strokeWidth={1} className="mx-auto mb-3" />
                <p className="font-semibold">Nenhuma entrega hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {delivered.map(order => (
                  <div key={order.id} className="card p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-[#1565C0] font-mono">#{order.numero_pedido}</p>
                        <p className="font-semibold text-gray-900">{order.cliente_nome}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} /> {order.endereco_completo}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#2E7D32]">{formatCurrency(order.total)}</p>
                        <span className="badge bg-green-100 text-green-700 text-xs">ENTREGUE</span>
                      </div>
                    </div>
                    {order.entregue_em && (
                      <div className="bg-green-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                        <span className="font-semibold">Entregue:</span>{' '}
                        {new Date(order.entregue_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {order.recebedor_nome && <> · <span className="font-semibold">Recebido por:</span> {order.recebedor_nome}</>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  )
}
