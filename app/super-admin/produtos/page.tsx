'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type Product = {
  id: string
  nome: string
  descricao?: string
  categoria: string
  subcategoria?: string
  preco_padrao: number
  preco_oferta?: number
  estoque?: number
  ativo: boolean
  destaque: boolean
  foto_url?: string
}

const VOLUME_CHIPS = ['20L','10L','5L','3L','2L','1.5L','1L','510ml','500ml','350ml','310ml','300ml','250ml','200ml']

const defaultForm = (): Omit<Product, 'id'> => ({
  nome: '', descricao: '', categoria: '', subcategoria: '',
  preco_padrao: 0, preco_oferta: undefined, estoque: 0,
  ativo: true, destaque: false, foto_url: '',
})

function ProductModal({ product, onClose, onSave }: {
  product?: Product | null; onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(product ? { ...product } : defaultForm())
  const [saving, setSaving] = useState(false)
  const [photoTab, setPhotoTab] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)

  const set = (field: keyof typeof form, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro ao fazer upload'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
    set('foto_url', urlData.publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.nome || !form.categoria || !form.preco_padrao) {
      toast.error('Preencha nome, categoria e preço'); return
    }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      ...form,
      preco_padrao: Number(form.preco_padrao),
      preco_oferta: form.preco_oferta ? Number(form.preco_oferta) : null,
    }
    let error
    if (product) {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id))
    } else {
      ({ error } = await supabase.from('products').insert(payload))
    }
    if (error) toast.error('Erro ao salvar: ' + error.message)
    else { toast.success('Produto salvo!'); onSave(); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Nome *</label>
              <input value={form.nome} onChange={e => set('nome', e.target.value)} className="input-base" placeholder="Ex: Água Mineral Natural" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Categoria *</label>
              <input value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input-base" placeholder="Água, Refrigerante..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Volume/Tamanho</label>
              <input value={form.subcategoria} onChange={e => set('subcategoria', e.target.value)} className="input-base" placeholder="Ex: 20L" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VOLUME_CHIPS.map(v => (
                  <button key={v} type="button" onClick={() => set('subcategoria', v)}
                    className={cn('text-xs px-2 py-1 rounded-full border transition-all',
                      form.subcategoria === v ? 'bg-[#1565C0] text-white border-[#1565C0]' : 'border-gray-200 text-gray-600 hover:border-[#1565C0]')}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Preço padrão *</label>
              <input type="number" step="0.01" value={form.preco_padrao} onChange={e => set('preco_padrao', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Preço oferta</label>
              <input type="number" step="0.01" value={form.preco_oferta || ''} onChange={e => set('preco_oferta', e.target.value || undefined)} className="input-base" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Estoque</label>
              <input type="number" value={form.estoque || 0} onChange={e => set('estoque', Number(e.target.value))} className="input-base" />
            </div>
            <div className="flex items-center gap-4 mt-2">
              {(['destaque', 'ativo'] as const).map(field => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set(field, !form[field])}
                    className={cn('w-10 h-6 rounded-full transition-colors flex items-center px-0.5',
                      form[field] ? (field === 'ativo' ? 'bg-[#2E7D32]' : 'bg-[#1565C0]') : 'bg-gray-200')}>
                    <div className={cn('w-5 h-5 bg-white rounded-full shadow transition-transform', form[field] ? 'translate-x-4' : 'translate-x-0')} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{field}</span>
                </label>
              ))}
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Descrição</label>
              <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={2} className="input-base resize-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Foto</label>
            <div className="flex gap-2 mb-3">
              {(['url', 'upload'] as const).map(tab => (
                <button key={tab} onClick={() => setPhotoTab(tab)}
                  className={cn('flex-1 py-1.5 rounded-lg text-sm font-medium transition-all',
                    photoTab === tab ? 'bg-[#1565C0] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {tab === 'url' ? 'URL' : 'Upload'}
                </button>
              ))}
            </div>
            {photoTab === 'url' ? (
              <input value={form.foto_url || ''} onChange={e => set('foto_url', e.target.value)} className="input-base" placeholder="https://..." />
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-[#1565C0] transition-colors">
                {uploading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <Upload size={20} className="text-gray-400" />}
                <span className="text-sm text-gray-500">{uploading ? 'Enviando...' : 'Clique para selecionar imagem'}</span>
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            )}
            {form.foto_url && (
              <div className="mt-2 flex items-center gap-2">
                <img src={form.foto_url} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
                <span className="text-xs text-gray-500">Preview</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-5 border-t">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar Produto'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; product?: Product | null }>({ open: false })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await createClient().from('products').select('*').order('nome')
    if (data) setProducts(data)
    setLoading(false)
  }

  const toggleField = async (id: string, field: 'ativo' | 'destaque', val: boolean) => {
    await createClient().from('products').update({ [field]: !val }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: !val } : p))
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return
    await createClient().from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Produto excluído')
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">{products.length} cadastrados</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn-primary gap-1.5">
          <Plus size={18} /> Novo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">Nenhum produto cadastrado</div>
            ) : products.map(p => (
              <div key={p.id} className="card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center shrink-0">
                    {p.foto_url ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" /> : <span className="text-2xl">💧</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{p.nome}</p>
                    <p className="text-xs text-gray-400">{p.categoria}{p.subcategoria ? ` · ${p.subcategoria}` : ''}</p>
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(p.preco_padrao)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <button onClick={() => toggleField(p.id, 'ativo', p.ativo)}
                      className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', p.ativo ? 'bg-[#2E7D32]' : 'bg-gray-200')}>
                      <div className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', p.ativo ? 'translate-x-4' : 'translate-x-0')} />
                    </button>
                    Ativo
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <button onClick={() => toggleField(p.id, 'destaque', p.destaque)}
                      className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', p.destaque ? 'bg-[#1565C0]' : 'bg-gray-200')}>
                      <div className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', p.destaque ? 'translate-x-4' : 'translate-x-0')} />
                    </button>
                    Destaque
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal({ open: true, product: p })} className="btn-secondary flex-1 text-xs py-1.5 gap-1">
                    <Edit2 size={13} /> Editar
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="btn-danger py-1.5 px-4">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Foto', 'Nome', 'Categoria', 'Preço', 'Ativo', 'Destaque', 'Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-50 flex items-center justify-center">
                          {p.foto_url ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" /> : <span className="text-lg">💧</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{p.nome}</p>
                        {p.subcategoria && <p className="text-xs text-gray-400">{p.subcategoria}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{formatCurrency(p.preco_padrao)}</p>
                        {p.preco_oferta && <p className="text-xs text-[#2E7D32]">{formatCurrency(p.preco_oferta)} oferta</p>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleField(p.id, 'ativo', p.ativo)}
                          className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', p.ativo ? 'bg-[#2E7D32]' : 'bg-gray-200')}>
                          <div className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', p.ativo ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleField(p.id, 'destaque', p.destaque)}
                          className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', p.destaque ? 'bg-[#1565C0]' : 'bg-gray-200')}>
                          <div className={cn('w-4 h-4 bg-white rounded-full shadow transition-transform', p.destaque ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setModal({ open: true, product: p })} className="btn-secondary text-xs py-1.5 px-3 gap-1">
                            <Edit2 size={13} /> Editar
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="btn-danger"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modal.open && (
        <ProductModal product={modal.product} onClose={() => setModal({ open: false })} onSave={loadProducts} />
      )}
    </div>
  )
}
