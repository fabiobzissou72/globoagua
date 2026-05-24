'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, ChevronRight, Edit3, Lock, ShoppingBag, MapPin, MessageCircle,
  Smartphone, Trash2, LogOut, X, Eye, EyeOff, Package, ChevronLeft,
  Send, Download, Loader2, CheckCircle, AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import tenant from '@/tenant.config'
import * as XLSX from 'xlsx'

type Profile = {
  id: string
  nome_completo?: string
  email?: string
  whatsapp?: string
  email_financeiro?: string
}

type Order = {
  id: string
  numero_pedido: string
  cliente_nome: string
  total: number
  status: string
  metodo_pagamento: string
  created_at: string
  endereco_completo?: string
  observacoes?: string
}

type OrderItem = {
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NOVO: 'bg-orange-100 text-orange-700',
    CONFIRMADO: 'bg-blue-100 text-blue-700',
    EM_ROTA: 'bg-purple-100 text-purple-700',
    ENTREGUE: 'bg-green-100 text-green-700',
    CANCELADO: 'bg-red-100 text-red-700',
  }
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status.replace('_', ' ')}</span>
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    const load = async () => {
      const sb = createClient()
      const { data } = await sb.from('order_items').select('*').eq('order_id', order.id)
      if (data) setItems(data)
    }
    load()
  }, [order.id])

  const pay = order.metodo_pagamento === 'pix' ? '⚡ PIX' : order.metodo_pagamento === 'cartao' ? '💳 Cartão' : order.metodo_pagamento === 'faturado' ? '📋 Faturado' : '💵 Dinheiro'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="font-bold text-lg">Pedido #{order.numero_pedido}</h2>
            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <span className="font-black text-lg text-[#1565C0]">{formatCurrency(order.total)}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
            <p className="text-xs font-semibold text-gray-400 mb-1">PAGAMENTO</p>
            <p>{pay}</p>
          </div>
          {order.endereco_completo && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
              <p className="text-xs font-semibold text-gray-400 mb-1">ENDEREÇO</p>
              <p>{order.endereco_completo}</p>
            </div>
          )}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">ITENS</p>
              <div className="card overflow-hidden divide-y divide-gray-50">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.produto_nome}</p>
                      <p className="text-xs text-gray-400">{item.quantidade}x · {formatCurrency(item.preco_unitario)}/un</p>
                    </div>
                    <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.observacoes && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
              <p className="text-xs font-semibold text-gray-400 mb-1">OBSERVAÇÕES</p>
              <p>{order.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrdersModal({ userId, profileName, emailFinanceiro, onClose, onUpdateEmail }: {
  userId: string
  profileName?: string
  emailFinanceiro?: string
  onClose: () => void
  onUpdateEmail: (email: string) => void
}) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sending, setSending] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [finEmail, setFinEmail] = useState(emailFinanceiro || '')

  useEffect(() => { loadOrders() }, [month, year])

  async function loadOrders() {
    setLoading(true)
    const sb = createClient()
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month, 1).toISOString()
    const { data } = await sb
      .from('orders')
      .select('id, numero_pedido, cliente_nome, total, status, metodo_pagamento, created_at, endereco_completo, observacoes')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const totalMes = orders.reduce((s, o) => s + Number(o.total), 0)

  function downloadExcel() {
    const rows = orders.map(o => ({
      'Nº Pedido': o.numero_pedido,
      'Data': new Date(o.created_at).toLocaleDateString('pt-BR'),
      'Status': o.status,
      'Pagamento': o.metodo_pagamento === 'pix' ? 'PIX' : o.metodo_pagamento === 'cartao' ? 'Cartão' : o.metodo_pagamento === 'faturado' ? 'Faturado' : 'Dinheiro',
      'Total R$': Number(o.total).toFixed(2),
      'Endereço': o.endereco_completo || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${MONTH_NAMES[month - 1]} ${year}`)
    XLSX.writeFile(wb, `pedidos_${MONTH_NAMES[month - 1]}_${year}.xlsx`)
  }

  async function handleSendReport() {
    if (!finEmail) { toast.error('Informe o e-mail do financeiro'); return }
    setSending(true)
    try {
      // Salva email financeiro no perfil
      const sb = createClient()
      await sb.from('profiles').update({ email_financeiro: finEmail }).eq('id', userId)
      onUpdateEmail(finEmail)

      const res = await fetch('/api/user/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month, year, emailTo: finEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Relatório enviado com sucesso!')
      setShowEmailModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b shrink-0">
            <h2 className="text-lg font-bold">Meus Pedidos</h2>
            <button onClick={onClose}><X size={20} /></button>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b shrink-0">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-xl"><ChevronLeft size={18} /></button>
            <span className="font-bold text-gray-800">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-xl"><ChevronRight size={18} /></button>
          </div>

          {/* Summary */}
          {!loading && orders.length > 0 && (
            <div className="px-5 py-3 bg-blue-50 border-b shrink-0 flex items-center justify-between">
              <p className="text-sm text-gray-600">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
              <p className="font-black text-[#1565C0]">{formatCurrency(totalMes)}</p>
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400 gap-3">
                <Package size={48} strokeWidth={1} />
                <p className="font-medium">Nenhum pedido em {MONTH_NAMES[month - 1]}</p>
              </div>
            ) : orders.map(order => (
              <button key={order.id} onClick={() => setSelectedOrder(order)}
                className="w-full card p-4 text-left hover:bg-gray-50 active:scale-[0.99] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">#{order.numero_pedido}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-gray-50 items-center">
                  <span className="text-xs text-gray-500">
                    {order.metodo_pagamento === 'pix' ? '⚡ PIX' : order.metodo_pagamento === 'cartao' ? '💳 Cartão' : order.metodo_pagamento === 'faturado' ? '📋 Faturado' : '💵 Dinheiro'}
                  </span>
                  <span className="font-bold text-[#1565C0]">{formatCurrency(order.total)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer actions */}
          {orders.length > 0 && (
            <div className="p-4 border-t bg-gray-50 shrink-0 flex gap-2">
              <button onClick={downloadExcel} className="btn-secondary flex-1 py-2.5 text-sm">
                <Download size={15} /> Baixar Excel
              </button>
              <button onClick={() => setShowEmailModal(true)} className="btn-primary flex-1 py-2.5 text-sm">
                <Send size={15} /> Enviar ao Financeiro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Send email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEmailModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base">Enviar Relatório</h3>
              <button onClick={() => setShowEmailModal(false)}><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Relatório de <strong>{MONTH_NAMES[month - 1]} {year}</strong> — {orders.length} pedido(s) · {formatCurrency(totalMes)}<br />
              Planilha .xlsx em anexo
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">E-mail do financeiro</label>
              <input type="email" value={finEmail} onChange={e => setFinEmail(e.target.value)}
                placeholder="financeiro@empresa.com.br" className="input-base" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEmailModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSendReport} disabled={sending} className="btn-primary flex-1">
                {sending ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><Send size={14} /> Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  )
}

function EditProfileModal({ profile, onClose, onSave }: {
  profile: Profile
  onClose: () => void
  onSave: (data: { nome_completo: string; whatsapp: string; email_financeiro: string }) => void
}) {
  const [nome, setNome] = useState(profile.nome_completo || '')
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '')
  const [emailFin, setEmailFin] = useState(profile.email_financeiro || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({ nome_completo: nome, whatsapp, email_financeiro: emailFin })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">Editar Perfil</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Nome completo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input-base" placeholder="Seu nome" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">WhatsApp</label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input-base" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">E-mail do Financeiro</label>
            <input type="email" value={emailFin} onChange={e => setEmailFin(e.target.value)} className="input-base" placeholder="financeiro@empresa.com.br" />
            <p className="text-xs text-gray-400 mt-1">Usado para enviar relatórios mensais de pedidos</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-5 py-3">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChange = async () => {
    if (newPass !== confirm) { toast.error('As senhas não coincidem'); return }
    if (newPass.length < 6) { toast.error('A senha deve ter no mínimo 6 caracteres'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPass, data: { must_change_password: false } })
    if (error) toast.error(error.message)
    else { toast.success('Senha alterada com sucesso!'); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">Alterar Senha</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {[
            { value: newPass, setter: setNewPass, label: 'Nova senha' },
            { value: confirm, setter: setConfirm, label: 'Confirmar nova senha' },
          ].map(({ value, setter, label }) => (
            <div key={label}>
              <label className="text-sm font-semibold text-gray-700 block mb-1">{label}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={value} onChange={e => setter(e.target.value)}
                  className="input-base pr-10" placeholder="••••••••" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleChange} disabled={saving} className="btn-primary w-full mt-5 py-3">
          {saving ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  )
}

function iPhoneInstallModal({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: '1', text: 'Abra o Safari no seu iPhone' },
    { icon: '2', text: 'Toque no botão de compartilhar (□↑) na barra inferior' },
    { icon: '3', text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
    { icon: '4', text: 'Toque em "Adicionar" no canto superior direito' },
    { icon: '5', text: 'O app aparecerá na sua tela inicial! 🎉' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">Instalar no iPhone</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#1565C0] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{s.icon}</div>
              <p className="text-sm text-gray-700 pt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PerfilContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [totalGasto, setTotalGasto] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
    if (searchParams.get('aviso') === 'senha') setModal('password')
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, nome_completo, whatsapp, email_financeiro')
      .eq('id', user.id)
      .single()
    setProfile({ ...profileData, id: user.id, email: user.email })

    const { data: ordersData } = await supabase
      .from('orders')
      .select('total, status')
      .eq('user_id', user.id)
    if (ordersData) {
      setOrderCount(ordersData.length)
      setTotalGasto(ordersData.filter(o => o.status === 'ENTREGUE').reduce((s, o) => s + Number(o.total), 0))
    }
    setLoading(false)
  }

  async function handleEditSave(data: { nome_completo: string; whatsapp: string; email_financeiro: string }) {
    if (!profile) return
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update(data).eq('id', profile.id)
    if (error) { toast.error('Erro ao salvar'); return }
    setProfile(prev => prev ? { ...prev, ...data } : prev)
    toast.success('Perfil atualizado!')
    setModal(null)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const clearCache = () => { localStorage.clear(); toast.success('Cache limpo!') }
  const initials = profile?.nome_completo?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const menuItems = [
    { icon: Edit3, label: 'Editar Perfil', action: () => setModal('edit'), color: '#1565C0' },
    { icon: Lock, label: 'Alterar Senha', action: () => setModal('password'), color: '#1565C0' },
    { icon: ShoppingBag, label: 'Meus Pedidos', action: () => setModal('orders'), color: '#1565C0', badge: orderCount },
    { icon: MessageCircle, label: 'Fale Conosco', action: () => window.open(`https://wa.me/${tenant.whatsapp}`, '_blank'), color: '#2E7D32' },
    { icon: Smartphone, label: 'Instalar no iPhone', action: () => setModal('install'), color: '#1565C0' },
    { icon: Trash2, label: 'Limpar Cache', action: clearCache, color: '#F57C00' },
  ]

  return (
    <div className="pb-28">
      <div className="bg-gradient-to-b from-[#1565C0] to-[#1976D2] px-6 pt-6 pb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{profile?.nome_completo || 'Usuário'}</h1>
            <p className="text-blue-200 text-sm">{profile?.email}</p>
            {profile?.whatsapp && <p className="text-blue-200 text-xs mt-0.5">{profile.whatsapp}</p>}
          </div>
        </div>
      </div>

      <div className="mx-4 -mt-5 card p-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-black text-[#1565C0]">{orderCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pedidos realizados</p>
        </div>
        <div className="text-center border-l">
          <p className="text-2xl font-black text-[#2E7D32]">{formatCurrency(totalGasto)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total gasto</p>
        </div>
      </div>

      <div className="mx-4 mt-4 card overflow-hidden divide-y divide-gray-50">
        {menuItems.map(({ icon: Icon, label, action, color, badge }) => (
          <button key={label} onClick={action}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="bg-[#1565C0] text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
            )}
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}
      </div>

      <div className="mx-4 mt-3">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut size={18} className="text-red-500" />
          <span className="text-red-600 font-semibold text-sm">Sair da conta</span>
        </button>
      </div>

      {modal === 'edit' && profile && (
        <EditProfileModal profile={profile} onClose={() => setModal(null)} onSave={handleEditSave} />
      )}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === 'orders' && profile && (
        <OrdersModal
          userId={profile.id}
          profileName={profile.nome_completo}
          emailFinanceiro={profile.email_financeiro}
          onClose={() => setModal(null)}
          onUpdateEmail={email => setProfile(p => p ? { ...p, email_financeiro: email } : p)}
        />
      )}
      {modal === 'install' && iPhoneInstallModal({ onClose: () => setModal(null) })}
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-[#1565C0] border-t-transparent rounded-full animate-spin" /></div>}>
      <PerfilContent />
    </Suspense>
  )
}
