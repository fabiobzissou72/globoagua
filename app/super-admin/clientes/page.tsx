'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, User, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Cliente {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  whatsapp?: string
  created_at: string
  tipo_pessoa?: string
  razao_social?: string
  nome_fantasia?: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const sb = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await sb
      .from('profiles')
      .select('id, nome_completo, email, telefone, whatsapp, created_at, tipo_pessoa, razao_social, nome_fantasia')
      .eq('role', 'cliente')
      .order('created_at', { ascending: false })

    setClientes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = clientes.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.nome_completo?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telefone?.includes(q) ||
      c.whatsapp?.includes(q)
    )
  })

  return (
    <div className="p-4 md:p-6 w-full max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} cadastrados</p>
        </div>
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-base pl-9"
            placeholder="Buscar por nome, e-mail ou telefone"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Cliente', 'E-mail / Telefone', 'Empresa B2B', 'Cadastro'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center text-gray-400">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-gray-400">Nenhum cliente encontrado</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <div className="font-semibold text-gray-900">{c.nome_completo || '—'}</div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-gray-700">{c.email}</div>
                  {c.telefone && <div className="text-xs text-gray-400">{c.telefone}</div>}
                </td>
                <td className="px-5 py-4">
                  {c.tipo_pessoa === 'PJ' && (c.razao_social || c.nome_fantasia) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                      <Building2 size={11} /> {c.nome_fantasia || c.razao_social}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Pessoa física</span>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
