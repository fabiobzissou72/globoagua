'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, FileText, BarChart2, MapPin,
  GitBranch, Truck, Users, Building2, Tag, Settings, LogOut, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Toaster } from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/produtos', label: 'Produtos', icon: Tag },
  { href: '/super-admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/super-admin/fechamento', label: 'Fechamento', icon: FileText },
  { href: '/super-admin/desempenho', label: 'Desempenho', icon: BarChart2 },
  { href: '/super-admin/rastreamento', label: 'Rastreamento', icon: MapPin },
  { href: '/super-admin/filiais', label: 'Filiais', icon: GitBranch },
  { href: '/super-admin/entregadores', label: 'Entregadores', icon: Truck },
  { href: '/super-admin/clientes', label: 'Clientes', icon: Users },
  { href: '/super-admin/empresas', label: 'Empresas B2B', icon: Building2 },
  { href: '/super-admin/precos', label: 'Preços Especiais', icon: Tag },
  { href: '/super-admin/configuracoes', label: 'Configurações', icon: Settings },
]

// Itens exibidos na nav inferior no mobile
const BOTTOM_NAV = [
  { href: '/super-admin', label: 'Home', icon: LayoutDashboard },
  { href: '/super-admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/super-admin/rastreamento', label: 'Mapa', icon: MapPin },
  { href: '/super-admin/produtos', label: 'Produtos', icon: Tag },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
      else setUserEmail(user.email || '')
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1565C0] rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">GA</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Globo Água</p>
            <p className="text-gray-400 text-xs">Super Admin</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-[#1565C0] text-white shadow-md'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}>
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-gray-400 text-xs truncate mb-3">{userEmail}</p>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-[#1a2332]">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-[#1a2332] h-full overflow-y-auto shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900 text-sm">Super Admin</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-white border-t flex fixed bottom-0 left-0 right-0 z-40 shadow-lg">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
                  active ? 'text-[#1565C0]' : 'text-gray-400'
                )}>
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium text-gray-400">
            <Menu size={20} />
            Mais
          </button>
        </nav>
      </div>
    </div>
  )
}
