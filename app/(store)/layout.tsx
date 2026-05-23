'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Search, MessageCircle, User, ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import tenant from '@/tenant.config'
import { Toaster } from 'react-hot-toast'

// --- Cart store using zustand-like pattern with localStorage ---
type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  foto_url?: string
}

type CartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: number
  count: number
}

// Global cart state (simple approach)
let cartListeners: (() => void)[] = []
let cartState: CartItem[] = []

try {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('ga_cart') : null
  if (saved) cartState = JSON.parse(saved)
} catch {}

export const cartStore: CartStore = {
  get items() { return cartState },
  get total() { return cartState.reduce((s, i) => s + i.price * i.qty, 0) },
  get count() { return cartState.reduce((s, i) => s + i.qty, 0) },
  addItem(item) {
    const existing = cartState.find(i => i.id === item.id)
    if (existing) {
      cartState = cartState.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
    } else {
      cartState = [...cartState, { ...item, qty: 1 }]
    }
    if (typeof window !== 'undefined') localStorage.setItem('ga_cart', JSON.stringify(cartState))
    cartListeners.forEach(l => l())
  },
  removeItem(id) {
    cartState = cartState.filter(i => i.id !== id)
    if (typeof window !== 'undefined') localStorage.setItem('ga_cart', JSON.stringify(cartState))
    cartListeners.forEach(l => l())
  },
  updateQty(id, qty) {
    if (qty <= 0) {
      cartState = cartState.filter(i => i.id !== id)
    } else {
      cartState = cartState.map(i => i.id === id ? { ...i, qty } : i)
    }
    if (typeof window !== 'undefined') localStorage.setItem('ga_cart', JSON.stringify(cartState))
    cartListeners.forEach(l => l())
  },
  clearCart() {
    cartState = []
    if (typeof window !== 'undefined') localStorage.removeItem('ga_cart')
    cartListeners.forEach(l => l())
  },
}

export function useCart() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1)
    cartListeners.push(listener)
    return () => { cartListeners = cartListeners.filter(l => l !== listener) }
  }, [])
  return cartStore
}

// --- PWA iOS Banner ---
function IOSInstallBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-[#1565C0] text-white px-4 py-3 flex items-center gap-3 animate-slide-up">
      <img src="/logo.svg" alt="GA" width={32} height={32} className="rounded-lg" />
      <div className="flex-1 text-sm">
        <p className="font-bold">Instale o Globo Água</p>
        <p className="text-blue-200 text-xs">Toque em <span className="font-bold">□↑</span> e depois <span className="font-bold">"Adicionar à Tela de Início"</span></p>
      </div>
      <button onClick={onDismiss} className="text-blue-200 hover:text-white">
        <X size={18} />
      </button>
    </div>
  )
}

// --- Cart Drawer ---
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-white h-full flex flex-col animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#1565C0]" /> Meu Carrinho
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
            <ShoppingCart size={48} strokeWidth={1} />
            <p className="text-lg font-medium">Carrinho vazio</p>
            <p className="text-sm text-center">Adicione produtos para continuar</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border flex-shrink-0">
                    {item.foto_url ? (
                      <img src={item.foto_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#1565C0] font-bold text-lg">💧</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-[#2E7D32] text-sm font-bold">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => cart.updateQty(item.id, item.qty - 1)}
                      className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                    <button onClick={() => cart.updateQty(item.id, item.qty + 1)}
                      className="w-7 h-7 rounded-full bg-[#1565C0] text-white flex items-center justify-center hover:bg-[#0D47A1]">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => cart.removeItem(item.id)} className="ml-1 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(cart.total)}</span>
              </div>
              <Link href="/checkout" onClick={onClose}
                className="btn-primary w-full justify-center text-base py-3">
                Finalizar Pedido →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// --- Main Layout ---
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const cart = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('ga_ios_banner_dismissed')
    if (isIOS && !isStandalone && !dismissed) {
      setShowIOSBanner(true)
    }
    loadVisualSettings()
  }, [])

  async function loadVisualSettings() {
    try {
      const supabase = createClient()
      const { data } = await supabase.from('settings').select('value').eq('key', 'visual').single()
      if (!data?.value) return
      const v = data.value as Record<string, string>
      if (v.logo_url) setLogoUrl(v.logo_url)
      if (v.primary_color) {
        document.documentElement.style.setProperty('--primary', v.primary_color)
        document.documentElement.style.setProperty('--primary-dark', adjustColor(v.primary_color, -20))
        document.documentElement.style.setProperty('--primary-light', adjustColor(v.primary_color, 15))
      }
      if (v.accent_color) {
        document.documentElement.style.setProperty('--accent', v.accent_color)
      }
    } catch {}
  }

  function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const dismissBanner = () => {
    setShowIOSBanner(false)
    localStorage.setItem('ga_ios_banner_dismissed', '1')
  }

  const handleWhatsapp = () => {
    window.open(`https://wa.me/${tenant.whatsapp}`, '_blank')
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      {showIOSBanner && <IOSInstallBanner onDismiss={dismissBanner} />}

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 shadow-md"
        style={{ top: showIOSBanner ? '60px' : '0', backgroundColor: 'var(--primary)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl || !logoError ? (
              <img
                src={logoUrl || '/logo.svg'}
                alt={tenant.name}
                className="h-9 w-auto"
                onError={() => { if (!logoUrl) setLogoError(true) }}
              />
            ) : (
              <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-sm">{tenant.shortName}</span>
              </div>
            )}
            <span className="text-white font-bold text-base hidden sm:block">{tenant.name}</span>
          </Link>
          <button onClick={() => setCartOpen(true)} className="relative p-2 text-white hover:bg-white/10 rounded-full">
            <ShoppingCart size={24} />
            {mounted && cart.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#2E7D32] text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cart.count > 9 ? '9+' : cart.count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto min-h-screen" style={{ paddingTop: showIOSBanner ? '130px' : '70px' }}>
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg pb-safe">
        <div className="max-w-2xl mx-auto flex items-center">
          {[
            { href: '/', icon: Home, label: 'Início' },
            { href: '/#catalogo', icon: Search, label: 'Catálogo' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-400 hover:text-[#1565C0] transition-colors">
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
          <button onClick={handleWhatsapp}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-400 hover:text-[#1565C0] transition-colors">
            <MessageCircle size={22} />
            <span className="text-xs font-medium">Contato</span>
          </button>
          <Link href="/perfil"
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-400 hover:text-[#1565C0] transition-colors">
            <User size={22} />
            <span className="text-xs font-medium">Perfil</span>
          </Link>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
