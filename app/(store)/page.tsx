'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, X, Star, ShoppingCart, Search, ChevronRight, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, cn } from '@/lib/utils'
import { useCart } from './layout'
import toast from 'react-hot-toast'

type Product = {
  id: string
  nome: string
  descricao?: string
  categoria: string
  subcategoria?: string
  preco_padrao: number
  preco_oferta?: number
  ativo: boolean
  destaque: boolean
  foto_url?: string
}

type StoreSettings = {
  banner_active?: boolean
  banner_text?: string
  banner_media_url?: string
  banner_media_type?: string
  banner_link?: string
}

type CompanyPrice = {
  product_id: string
  preco_especial: number
}

function ProductModal({
  product,
  specialPrice,
  onClose,
}: {
  product: Product
  specialPrice?: number
  onClose: () => void
}) {
  const [qty, setQty] = useState(1)
  const cart = useCart()
  const displayPrice = specialPrice ?? product.preco_oferta ?? product.preco_padrao

  const handleAdd = () => {
    cart.addItem({
      id: product.id,
      name: product.nome,
      price: displayPrice,
      foto_url: product.foto_url,
    })
    toast.success(`${product.nome} adicionado!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up shadow-2xl">
        {/* Image */}
        <div className="relative h-56 bg-white overflow-hidden">
          {product.foto_url ? (
            <img
              src={product.foto_url}
              alt={product.nome}
              className="w-full h-full"
              style={{ objectFit: 'contain', padding: '12px' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-blue-50 to-blue-100">💧</div>
          )}
          <button onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white">
            <X size={18} />
          </button>
          {product.destaque && (
            <div className="absolute top-4 left-4 bg-[#1565C0] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={12} fill="white" /> Destaque
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{product.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-blue-50 text-[#1565C0] px-2 py-0.5 rounded-full font-medium">{product.categoria}</span>
                {product.subcategoria && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{product.subcategoria}</span>
                )}
              </div>
            </div>
            <div className="text-right ml-4">
              {specialPrice ? (
                <>
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(product.preco_padrao)}</p>
                  <p className="text-xl font-black text-[#2E7D32]">{formatCurrency(specialPrice)}</p>
                  <p className="text-xs text-[#2E7D32] font-medium">Preço especial</p>
                </>
              ) : product.preco_oferta ? (
                <>
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(product.preco_padrao)}</p>
                  <p className="text-xl font-black text-[#2E7D32]">{formatCurrency(product.preco_oferta)}</p>
                </>
              ) : (
                <p className="text-xl font-black text-gray-900">{formatCurrency(product.preco_padrao)}</p>
              )}
            </div>
          </div>

          {product.descricao && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{product.descricao}</p>
          )}

          <div className="flex items-center gap-4 mt-5">
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50">
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-[#1565C0]">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={handleAdd}
              className="flex-1 btn-primary py-3 text-base">
              <ShoppingCart size={18} />
              Adicionar · {formatCurrency(displayPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  specialPrice,
  onOpen,
}: {
  product: Product
  specialPrice?: number
  onOpen: () => void
}) {
  const cart = useCart()
  const displayPrice = specialPrice ?? product.preco_oferta ?? product.preco_padrao
  const isOnSale = !!(specialPrice || product.preco_oferta)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    cart.addItem({
      id: product.id,
      name: product.nome,
      price: displayPrice,
      foto_url: product.foto_url,
    })
    toast.success(`${product.nome} adicionado!`, { duration: 1500 })
  }

  return (
    <div
      onClick={onOpen}
      className="card overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group">
      <div className="relative h-36 bg-white overflow-hidden">
        {product.foto_url ? (
          <img
            src={product.foto_url}
            alt={product.nome}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            style={{ objectFit: 'contain', padding: '8px' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-50 to-blue-100">💧</div>
        )}
        {product.destaque && (
          <div className="absolute top-2 left-2 bg-[#1565C0] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star size={9} fill="white" /> Top
          </div>
        )}
        {isOnSale && (
          <div className="absolute top-2 right-2 bg-[#2E7D32] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Oferta
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">{product.nome}</p>
        <p className="text-xs text-gray-500 mt-0.5">{product.categoria}{product.subcategoria ? ` · ${product.subcategoria}` : ''}</p>

        <div className="flex items-end justify-between mt-2">
          <div>
            {product.preco_oferta && !specialPrice && (
              <p className="text-xs text-gray-400 line-through leading-tight">{formatCurrency(product.preco_padrao)}</p>
            )}
            {specialPrice && (
              <p className="text-xs text-gray-400 line-through leading-tight">{formatCurrency(product.preco_padrao)}</p>
            )}
            <p className={cn('text-base font-black leading-tight', specialPrice ? 'text-[#2E7D32]' : 'text-gray-900')}>
              {formatCurrency(displayPrice)}
            </p>
          </div>
          <button
            onClick={handleQuickAdd}
            className="w-8 h-8 bg-[#1565C0] text-white rounded-full flex items-center justify-center hover:bg-[#0D47A1] active:scale-90 transition-all shadow-md">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<StoreSettings>({})
  const [companyPrices, setCompanyPrices] = useState<CompanyPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const catalogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    // Handle anchor link scroll
    if (window.location.hash === '#catalogo' && catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  async function loadData() {
    const supabase = createClient()
    setLoading(true)
    try {
      const [productsRes, settingsRes, userRes] = await Promise.all([
        supabase.from('products').select('*').eq('ativo', true).order('destaque', { ascending: false }),
        supabase.from('settings').select('value').eq('key', 'banner').maybeSingle(),
        supabase.auth.getUser(),
      ])
      if (productsRes.data) setProducts(productsRes.data)
      if (settingsRes.data?.value) setSettings(settingsRes.data.value as StoreSettings)
      if (userRes.data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', userRes.data.user.id)
          .maybeSingle()
        if (profile?.company_id) {
          const pricesRes = await supabase
            .from('company_prices')
            .select('product_id, preco_especial')
            .eq('company_id', profile.company_id)
          if (pricesRes.data) setCompanyPrices(pricesRes.data)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))]

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'Todos' || p.categoria === activeCategory
    const q = searchQuery.toLowerCase()
    const matchQ = !q || p.nome.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const getSpecialPrice = (productId: string) =>
    companyPrices.find(cp => cp.product_id === productId)?.preco_especial

  return (
    <div className="pb-28">
      {/* Promo Banner */}
      {settings.banner_active && (settings.banner_media_url || settings.banner_text) && (
        <div
          className="mx-4 mt-3 rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => settings.banner_link && window.open(settings.banner_link, '_blank')}>
          {settings.banner_media_url ? (
            <div className="relative">
              <img src={settings.banner_media_url} alt="Promoção" className="w-full h-40 object-cover" />
              {settings.banner_text && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-lg leading-tight">{settings.banner_text}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#1565C0] to-[#1976D2] p-5">
              <div className="flex items-center gap-3">
                <Tag size={28} className="text-white flex-shrink-0" />
                <p className="text-white font-bold text-base leading-snug">{settings.banner_text}</p>
                <ChevronRight size={20} className="text-white/70 flex-shrink-0 ml-auto" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-base pl-10 bg-white"
          />
        </div>
      </div>

      {/* Category chips */}
      <div id="catalogo" ref={catalogRef} className="mt-4 px-4 flex gap-2 overflow-x-auto pb-1 scroll-smooth no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
              activeCategory === cat
                ? 'bg-[#1565C0] text-white shadow-md shadow-blue-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1565C0] hover:text-[#1565C0]'
            )}>
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="px-4 mt-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-52 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="text-6xl">🔍</div>
            <p className="font-semibold text-lg">Nenhum produto encontrado</p>
            <p className="text-sm">Tente outra categoria ou busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                specialPrice={getSpecialPrice(p.id)}
                onOpen={() => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer spacer */}
      <div className="h-6" />

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          specialPrice={getSpecialPrice(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
