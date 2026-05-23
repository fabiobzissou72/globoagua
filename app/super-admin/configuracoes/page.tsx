'use client'

import { useState, useEffect } from 'react'
import { Save, Upload, Loader2, Globe, Truck, Webhook, CreditCard, Eye, EyeOff, Palette, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type Settings = {
  store_name?: string
  whatsapp?: string
  banner_active?: boolean
  banner_text?: string
  banner_media_url?: string
  banner_media_type?: string
  banner_link?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  delivery_type?: string
  delivery_value?: number
  speedit_webhook?: string
  payment_provider?: string
  payment_public_key?: string
  payment_mode?: string
  pix_key?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
}

const TABS = [
  { id: 'geral', label: 'Geral', icon: Globe },
  { id: 'visual', label: 'Visual', icon: Palette },
  { id: 'entrega', label: 'Entrega', icon: Truck },
  { id: 'webhook', label: 'Webhook', icon: Webhook },
  { id: 'pagamento', label: 'Pagamento', icon: CreditCard },
]

const PRESET_COLORS = [
  '#1565C0', '#0D47A1', '#1976D2',
  '#2E7D32', '#1B5E20', '#388E3C',
  '#D32F2F', '#B71C1C', '#E53935',
  '#F57C00', '#E65100', '#FB8C00',
  '#6A1B9A', '#4A148C', '#7B1FA2',
  '#00838F', '#006064', '#00ACC1',
]

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState('geral')
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const merged: Settings = {}
      data.forEach(row => Object.assign(merged, row.value))
      setSettings(merged)
    }
    setLoading(false)
  }

  const set = (k: keyof Settings, v: unknown) => setSettings(s => ({ ...s, [k]: v }))

  async function saveSettings() {
    setSaving(true)
    const supabase = createClient()
    const bannerKeys = ['banner_active', 'banner_text', 'banner_media_url', 'banner_media_type', 'banner_link']
    const visualKeys = ['logo_url', 'favicon_url', 'primary_color', 'secondary_color', 'accent_color']
    const bannerValue: Record<string, unknown> = {}
    const visualValue: Record<string, unknown> = {}
    const configValue: Record<string, unknown> = {}
    Object.entries(settings).forEach(([k, v]) => {
      if (bannerKeys.includes(k)) bannerValue[k] = v
      else if (visualKeys.includes(k)) visualValue[k] = v
      else configValue[k] = v
    })
    const [r1, r2, r3] = await Promise.all([
      supabase.from('settings').upsert({ key: 'banner', value: bannerValue }, { onConflict: 'key' }),
      supabase.from('settings').upsert({ key: 'visual', value: visualValue }, { onConflict: 'key' }),
      supabase.from('settings').upsert({ key: 'config', value: configValue }, { onConflict: 'key' }),
    ])
    if (r1.error || r2.error || r3.error) toast.error('Erro ao salvar configurações')
    else toast.success('Configurações salvas!')
    setSaving(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url' | 'banner_media_url', folder: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(field)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro no upload'); setUploading(null); return }
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    set(field, data.publicUrl)
    if (field === 'banner_media_url') {
      set('banner_media_type', file.type.startsWith('video') ? 'video' : 'image')
    }
    setUploading(null)
    toast.success('Arquivo enviado!')
    e.target.value = ''
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
  )

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <button onClick={saveSettings} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar</>}
        </button>
      </div>

      {/* Tabs — scroll horizontal no mobile */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0',
              tab === id ? 'bg-white text-[#1565C0] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="space-y-4 max-w-2xl">

        {/* GERAL */}
        {tab === 'geral' && (
          <>
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Informações da Loja</h2>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nome da loja</label>
                <input value={settings.store_name || ''} onChange={e => set('store_name', e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">WhatsApp</label>
                <input value={settings.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} className="input-base" placeholder="5511999999999" />
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Banner Promocional</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Ativo</span>
                  <button onClick={() => set('banner_active', !settings.banner_active)}
                    className={cn('w-10 h-6 rounded-full transition-colors flex items-center px-0.5',
                      settings.banner_active ? 'bg-[#2E7D32]' : 'bg-gray-200')}>
                    <div className={cn('w-5 h-5 bg-white rounded-full shadow transition-transform',
                      settings.banner_active ? 'translate-x-4' : 'translate-x-0')} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Texto do banner</label>
                <input value={settings.banner_text || ''} onChange={e => set('banner_text', e.target.value)} className="input-base" placeholder="Ex: Promoção especial! 20% off" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Link de destino</label>
                <input value={settings.banner_link || ''} onChange={e => set('banner_link', e.target.value)} className="input-base" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Mídia do banner (URL ou Upload)</label>
                <input value={settings.banner_media_url || ''} onChange={e => set('banner_media_url', e.target.value)} className="input-base mb-2" placeholder="https://..." />
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl py-3 px-4 hover:border-[#1565C0] transition-colors">
                  {uploading === 'banner_media_url' ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <Upload size={16} className="text-gray-400" />}
                  <span className="text-sm text-gray-500">{uploading === 'banner_media_url' ? 'Enviando...' : 'Fazer upload de imagem/vídeo'}</span>
                  <input type="file" accept="image/*,video/*" onChange={e => handleUpload(e, 'banner_media_url', 'banners')} className="hidden" />
                </label>
                {settings.banner_media_url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                    {settings.banner_media_type === 'video' ? (
                      <video src={settings.banner_media_url} className="rounded-xl h-32 object-cover w-full" controls />
                    ) : (
                      <img src={settings.banner_media_url} alt="Banner" className="rounded-xl h-32 object-cover w-full" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-900">SEO</h2>
              {[
                { key: 'seo_title', label: 'Título SEO', placeholder: 'Globo Água · Disk água' },
                { key: 'seo_description', label: 'Descrição SEO', placeholder: 'Descrição para motores de busca...' },
                { key: 'seo_keywords', label: 'Palavras-chave', placeholder: 'água, delivery, disk água' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
                  <input value={(settings as Record<string, string>)[key] || ''} onChange={e => set(key as keyof Settings, e.target.value)}
                    className="input-base" placeholder={placeholder} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* VISUAL */}
        {tab === 'visual' && (
          <>
            {/* Logo */}
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><ImageIcon size={18} /> Logo</h2>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">URL da logo</label>
                <input value={settings.logo_url || ''} onChange={e => set('logo_url', e.target.value)} className="input-base" placeholder="https://..." />
              </div>

              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl py-4 px-4 hover:border-[#1565C0] transition-colors">
                {uploading === 'logo_url' ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Upload size={18} className="text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-700">{uploading === 'logo_url' ? 'Enviando...' : 'Fazer upload da logo'}</p>
                  <p className="text-xs text-gray-400">PNG, SVG ou WebP. Fundo transparente recomendado.</p>
                </div>
                <input type="file" accept="image/*" onChange={e => handleUpload(e, 'logo_url', 'logos')} className="hidden" />
              </label>

              {settings.logo_url && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-white rounded-lg p-2 border shadow-sm">
                    <img src={settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
                  </div>
                  <div className="bg-[#1565C0] rounded-lg p-2">
                    <img src={settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
                  </div>
                  <p className="text-xs text-gray-500">Preview em fundo claro e escuro</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Favicon (URL ou Upload)</label>
                <input value={settings.favicon_url || ''} onChange={e => set('favicon_url', e.target.value)} className="input-base mb-2" placeholder="https://... (32×32 px)" />
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl py-3 px-4 hover:border-[#1565C0] transition-colors">
                  {uploading === 'favicon_url' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="text-gray-400" />}
                  <span className="text-sm text-gray-500">{uploading === 'favicon_url' ? 'Enviando...' : 'Upload do favicon (.ico, .png)'}</span>
                  <input type="file" accept="image/*" onChange={e => handleUpload(e, 'favicon_url', 'logos')} className="hidden" />
                </label>
              </div>
            </div>

            {/* Cores */}
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Palette size={18} /> Cores da Marca</h2>

              {[
                { key: 'primary_color', label: 'Cor primária', description: 'Botões, links e destaques principais', default: '#1565C0' },
                { key: 'secondary_color', label: 'Cor secundária', description: 'Fundos e elementos de suporte', default: '#1976D2' },
                { key: 'accent_color', label: 'Cor de destaque', description: 'Badges, notificações e alertas', default: '#2E7D32' },
              ].map(({ key, label, description, default: def }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 block mb-0.5">{label}</label>
                  <p className="text-xs text-gray-400 mb-2">{description}</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={(settings as Record<string, string>)[key] || def}
                      onChange={e => set(key as keyof Settings, e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                    />
                    <input
                      value={(settings as Record<string, string>)[key] || def}
                      onChange={e => set(key as keyof Settings, e.target.value)}
                      className="input-base font-mono text-sm"
                      placeholder={def}
                    />
                  </div>
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => set(key as keyof Settings, color)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                          (settings as Record<string, string>)[key] === color ? 'border-gray-800 scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Preview */}
              {(settings.primary_color || settings.secondary_color) && (
                <div className="mt-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Preview das cores</p>
                  <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 rounded-xl text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: settings.primary_color || '#1565C0' }}>
                      Botão primário
                    </button>
                    <button className="px-4 py-2 rounded-xl text-sm font-bold border-2"
                      style={{ borderColor: settings.primary_color || '#1565C0', color: settings.primary_color || '#1565C0' }}>
                      Secundário
                    </button>
                    <span className="px-3 py-1 rounded-full text-white text-xs font-bold"
                      style={{ backgroundColor: settings.accent_color || '#2E7D32' }}>
                      Badge
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ENTREGA */}
        {tab === 'entrega' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Configurações de Entrega</h2>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Tipo de entrega</label>
              <select value={settings.delivery_type || 'gratis'} onChange={e => set('delivery_type', e.target.value)} className="input-base">
                <option value="gratis">Grátis</option>
                <option value="fixo">Fixo</option>
                <option value="por_raio">Por raio</option>
              </select>
            </div>
            {settings.delivery_type !== 'gratis' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  {settings.delivery_type === 'fixo' ? 'Valor fixo (R$)' : 'Valor por km (R$)'}
                </label>
                <input type="number" step="0.01" value={settings.delivery_value || ''} onChange={e => set('delivery_value', Number(e.target.value))}
                  className="input-base" />
              </div>
            )}
          </div>
        )}

        {/* WEBHOOK */}
        {tab === 'webhook' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Integração Webhook</h2>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Speedit Webhook URL</label>
              <input value={settings.speedit_webhook || ''} onChange={e => set('speedit_webhook', e.target.value)}
                className="input-base" placeholder="https://hook.speedit.com/..." />
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-[#1565C0]">
              <p className="font-semibold mb-1">Sobre Webhooks</p>
              <p>O sistema enviará notificações POST para esta URL sempre que um pedido for criado, atualizado ou entregue.</p>
            </div>
          </div>
        )}

        {/* PAGAMENTO */}
        {tab === 'pagamento' && (
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Configurações de Pagamento</h2>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Provedor</label>
              <select value={settings.payment_provider || 'mercadopago'} onChange={e => set('payment_provider', e.target.value)} className="input-base">
                <option value="mercadopago">MercadoPago</option>
                <option value="pagseguro">PagSeguro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Public Key</label>
              <div className="relative">
                <input type={showKey ? 'text' : 'password'} value={settings.payment_public_key || ''}
                  onChange={e => set('payment_public_key', e.target.value)}
                  className="input-base pr-10" placeholder="APP_USR-..." />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Modo</label>
              <select value={settings.payment_mode || 'sandbox'} onChange={e => set('payment_mode', e.target.value)} className="input-base">
                <option value="sandbox">Sandbox (Testes)</option>
                <option value="production">Produção</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Chave PIX</label>
              <input value={settings.pix_key || ''} onChange={e => set('pix_key', e.target.value)}
                className="input-base" placeholder="CPF, CNPJ, e-mail ou chave aleatória" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
