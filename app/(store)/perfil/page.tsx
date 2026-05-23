'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, ChevronRight, Edit3, Lock, ShoppingBag, MapPin, MessageCircle,
  Smartphone, Trash2, LogOut, X, Eye, EyeOff, Check, Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import tenant from '@/tenant.config'

type Profile = {
  id: string
  nome_completo?: string
  email?: string
  whatsapp?: string
}

type Order = {
  id: string
  numero_pedido: string
  cliente_nome: string
  total: number
  status: string
  metodo_pagamento: string
  created_at: string
}

// Status badge helper
function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>
}

// Edit Profile Modal
function EditProfileModal({ profile, onClose, onSave }: {
  profile: Profile
  onClose: () => void
  onSave: (data: { nome_completo: string; whatsapp: string }) => void
}) {
  const [nome, setNome] = useState(profile.nome_completo || '')
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({ nome_completo: nome, whatsapp })
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
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-5 py-3">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

// Change Password Modal
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChange = async () => {
    if (newPass !== confirm) { toast.error('As senhas não coincidem'); return }
    if (newPass.length < 6) { toast.error('A senha deve ter no mínimo 6 caracteres'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPass,
      data: { must_change_password: false },
    })
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

// Orders Modal
function OrdersModal({ orders, onClose }: { orders: Order[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-bold">Meus Pedidos</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400 gap-3">
              <Package size={48} strokeWidth={1} />
              <p className="font-medium">Nenhum pedido ainda</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">#{order.numero_pedido}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-sm text-gray-600">
                  {order.metodo_pagamento === 'pix' ? 'PIX' : order.metodo_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro'}
                </span>
                <span className="font-bold text-[#1565C0]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// iPhone Install Modal
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
              <div className="w-8 h-8 bg-[#1565C0] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.icon}
              </div>
              <p className="text-sm text-gray-700 pt-1">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 p-3 bg-blue-50 rounded-xl text-xs text-[#1565C0]">
          💡 O app funciona offline e você receberá notificações de pedidos
        </div>
      </div>
    </div>
  )
}

function PerfilContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
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
      .select('id, nome_completo, whatsapp')
      .eq('id', user.id)
      .single()
    setProfile({ ...profileData, id: user.id, email: user.email })
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, numero_pedido, cliente_nome, total, status, metodo_pagamento, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (ordersData) setOrders(ordersData)
    setLoading(false)
  }

  async function handleEditSave(data: { nome_completo: string; whatsapp: string }) {
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

  const clearCache = () => {
    localStorage.clear()
    toast.success('Cache limpo com sucesso!')
  }

  const initials = profile?.nome_completo?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const menuItems = [
    { icon: Edit3, label: 'Editar Perfil', action: () => setModal('edit'), color: '#1565C0' },
    { icon: Lock, label: 'Alterar Senha', action: () => setModal('password'), color: '#1565C0' },
    { icon: ShoppingBag, label: 'Meus Pedidos', action: () => setModal('orders'), color: '#1565C0', badge: orders.length },
    { icon: MapPin, label: 'Meus Endereços', action: () => toast.error('Em breve!'), color: '#1565C0' },
    { icon: MessageCircle, label: 'Fale Conosco', action: () => window.open(`https://wa.me/${tenant.whatsapp}`, '_blank'), color: '#2E7D32' },
    { icon: Smartphone, label: 'Instalar no iPhone', action: () => setModal('install'), color: '#1565C0' },
    { icon: Trash2, label: 'Limpar Cache', action: clearCache, color: '#F57C00' },
  ]

  return (
    <div className="pb-28">
      {/* Profile Header */}
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

      {/* Stats */}
      <div className="mx-4 -mt-5 card p-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-black text-[#1565C0]">{orders.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pedidos realizados</p>
        </div>
        <div className="text-center border-l">
          <p className="text-2xl font-black text-[#2E7D32]">
            {formatCurrency(orders.filter(o => o.status === 'ENTREGUE').reduce((s, o) => s + o.total, 0))}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total gasto</p>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-4 mt-4 card overflow-hidden divide-y divide-gray-50">
        {menuItems.map(({ icon: Icon, label, action, color, badge }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}>
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

      {/* Logout */}
      <div className="mx-4 mt-3">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut size={18} className="text-red-500" />
          <span className="text-red-600 font-semibold text-sm">Sair da conta</span>
        </button>
      </div>

      {/* Modals */}
      {modal === 'edit' && profile && (
        <EditProfileModal profile={profile} onClose={() => setModal(null)} onSave={handleEditSave} />
      )}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === 'orders' && <OrdersModal orders={orders} onClose={() => setModal(null)} />}
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
