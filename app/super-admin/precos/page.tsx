'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

type Product = { id: string; nome: string; categoria: string; preco_padrao: number; subcategoria?: string }
type Company = { id: string; razao_social: string }
type Client = { id: string; nome_completo?: string; email?: string }
type PriceMap = Record<string, string>

export default function PrecosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<'company' | 'client'>('company')
  const [selectedId, setSelectedId] = useState('')
  const [prices, setPrices] = useState<PriceMap>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const [prodRes, compRes, clientRes] = await Promise.all([
      supabase.from('products').select('id, nome, categoria, preco_padrao, subcategoria').eq('ativo', true).order('nome'),
      supabase.from('companies').select('id, razao_social').order('razao_social'),
      supabase.from('profiles').select('id, nome_completo, email').eq('role', 'cliente').limit(100),
    ])
    if (prodRes.data) setProducts(prodRes.data)
    if (compRes.data) setCompanies(compRes.data)
    if (clientRes.data) setClients(clientRes.data)
    setLoading(false)
  }

  async function loadPrices(id: string, type: 'company' | 'client') {
    if (!id) { setPrices({}); return }
    const supabase = createClient()
    const field = type === 'company' ? 'company_id' : 'user_id'
    const { data } = await supabase.from('company_prices').select('product_id, preco_especial').eq(field, id)
    if (data) {
      const map: PriceMap = {}
      data.forEach(row => { map[row.product_id] = String(row.preco_especial) })
      setPrices(map)
    } else {
      setPrices({})
    }
  }

  const handleTypeChange = (type: 'company' | 'client') => {
    setSelectedType(type)
    setSelectedId('')
    setPrices({})
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    loadPrices(id, selectedType)
  }

  const savePrice = async (productId: string) => {
    if (!selectedId) return
    const val = prices[productId]
    if (!val || isNaN(Number(val))) { toast.error('Preço inválido'); return }
    setSaving(s => ({ ...s, [productId]: true }))
    const supabase = createClient()
    const field = selectedType === 'company' ? 'company_id' : 'user_id'
    const record = { [field]: selectedId, product_id: productId, preco_especial: Number(val) }
    const { error } = await supabase.from('company_prices').upsert(record, { onConflict: `${field},product_id` })
    if (error) toast.error('Erro ao salvar')
    else toast.success('Preço salvo!')
    setSaving(s => ({ ...s, [productId]: false }))
  }

  const removePrice = async (productId: string) => {
    if (!selectedId) return
    const supabase = createClient()
    const field = selectedType === 'company' ? 'company_id' : 'user_id'
    await supabase.from('company_prices').delete().eq(field, selectedId).eq('product_id', productId)
    setPrices(p => { const n = { ...p }; delete n[productId]; return n })
    toast.success('Preço especial removido')
  }

  const groupedByCategory: Record<string, Product[]> = {}
  products.forEach(p => {
    if (!groupedByCategory[p.categoria]) groupedByCategory[p.categoria] = []
    groupedByCategory[p.categoria].push(p)
  })

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Preços Especiais</h1>
        <p className="text-sm text-gray-500">Configure preços personalizados por empresa ou cliente</p>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex gap-2 mb-4">
          {(['company', 'client'] as const).map(type => (
            <button key={type} onClick={() => handleTypeChange(type)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                ${selectedType === type ? 'bg-[#1565C0] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {type === 'company' ? 'Empresa B2B' : 'Cliente Individual'}
            </button>
          ))}
        </div>
        <select value={selectedId} onChange={e => handleSelect(e.target.value)} className="input-base">
          <option value="">Selecione {selectedType === 'company' ? 'uma empresa' : 'um cliente'}...</option>
          {(selectedType === 'company' ? companies : clients).map((item: Company | Client) => (
            <option key={item.id} value={item.id}>
              {'razao_social' in item ? item.razao_social : (item.nome_completo || item.email || item.id)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : !selectedId ? (
        <div className="card p-10 text-center text-gray-400">
          <Tag size={48} strokeWidth={1} className="mx-auto mb-3" />
          <p className="font-semibold">Selecione um cliente ou empresa</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByCategory).map(([category, catProducts]) => (
            <div key={category} className="card overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h3 className="font-bold text-sm text-gray-700">{category}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Produto</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Preço Padrão</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs">Preço Especial</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{product.nome}</p>
                        {product.subcategoria && <p className="text-xs text-gray-400">{product.subcategoria}</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-600">{formatCurrency(product.preco_padrao)}</td>
                      <td className="px-4 py-3">
                        <div className="relative" style={{ minWidth: '11rem' }}>
                          <input
                            type="number" step="0.01"
                            value={prices[product.id] || ''}
                            onChange={e => setPrices(p => ({ ...p, [product.id]: e.target.value }))}
                            placeholder={`R$ ${product.preco_padrao.toFixed(2)}`}
                            className="input-base px-3 py-2 text-sm w-full"
                          />
                        </div>
                        {prices[product.id] && Number(prices[product.id]) < product.preco_padrao && (
                          <p className="text-xs text-[#2E7D32] mt-0.5 font-medium">
                            Economia: {formatCurrency(product.preco_padrao - Number(prices[product.id]))}
                          </p>
                        )}
                        {prices[product.id] && Number(prices[product.id]) > product.preco_padrao && (
                          <p className="text-xs text-orange-500 mt-0.5 font-medium">
                            Acréscimo: +{formatCurrency(Number(prices[product.id]) - product.preco_padrao)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => savePrice(product.id)} disabled={saving[product.id]}
                            className="btn-primary text-xs py-1.5 px-3">
                            {saving[product.id] ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Salvar
                          </button>
                          {prices[product.id] && (
                            <button onClick={() => removePrice(product.id)} className="btn-danger text-xs py-1.5 px-2">
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
