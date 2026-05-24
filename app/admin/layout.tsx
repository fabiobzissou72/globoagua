'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart, FileText, BarChart2, MapPin, LogOut, Menu
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Toaster } from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/admin', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/fechamento', label: 'Fechamento', icon: FileText },
  { href: '/admin/desempenho', label: 'Desempenho', icon: BarChart2 },
  { href: '/admin/rastreamento', label: 'Rastreamento', icon: MapPin },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1565C0] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">GA</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Globo Água</p>
            <p className="text-gray-400 text-xs mt-0.5">Administração</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-gray-400 text-xs truncate mb-3">{userEmail}</p>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors">
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[#1a2332]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 bg-[#1a2332] h-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900">Admin</span>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-white border-t flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
        </nav>
      </div>
    </div>
  )
}
