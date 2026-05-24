'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, MapPin, User, CreditCard, ClipboardList, Copy, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, normalizePhone } from '@/lib/utils'
import { cartStore } from '../layout'
import toast from 'react-hot-toast'
import tenant from '@/tenant.config'

type Branch = { id: string; nome: string }
type SpecialPrice = { product_id: string; preco_especial: number }

const STEPS_NORMAL = [
  { id: 1, label: 'Entrega', icon: MapPin },
  { id: 2, label: 'Destinatário', icon: User },
  { id: 3, label: 'Pagamento', icon: CreditCard },
  { id: 4, label: 'Confirmar', icon: ClipboardList },
]

const STEPS_FATURADO = [
  { id: 1, label: 'Entrega', icon: MapPin },
  { id: 2, label: 'Destinatário', icon: User },
  { id: 3, label: 'Confirmar', icon: ClipboardList },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [branches, setBranches] = useState<Branch[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [isFaturado, setIsFaturado] = useState(false)
  const [prazoFaturamento, setPrazoFaturamento] = useState(30)
  const [savedAddress, setSavedAddress] = useState<Record<string, string> | null>(null)
  const [showSavedAddress, setShowSavedAddress] = useState(false)

  // Step 1
  const [branchId, setBranchId] = useState('')
  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')

  // Step 2
  const [recipientName, setRecipientName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [reference, setReference] = useState('')
  const [observations, setObservations] = useState('')

  // Step 3 (só aparece se não faturado)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix')
  const [changeAmount, setChangeAmount] = useState('')

  const STEPS = isFaturado ? STEPS_FATURADO : STEPS_NORMAL
  const TOTAL_STEPS = STEPS.length
  const items = cartStore.items

  function getEffectivePrice(productId: string, originalPrice: number): number {
    const sp = specialPrices.find(p => p.product_id === productId)
    return sp ? sp.preco_especial : originalPrice
  }

  const effectiveTotal = items.reduce((sum, item) => sum + getEffectivePrice(item.id, item.price) * item.qty, 0)
  const originalTotal = cartStore.total
  const discount = originalTotal - effectiveTotal

  useEffect(() => {
    if (items.length === 0) { router.replace('/'); return }
    loadBranches()
    loadUserProfile()
  }, [])

  async function loadBranches() {
    const supabase = createClient()
    const { data } = await supabase.from('branches').select('id, nome').order('nome')
    if (data) setBranches(data)
  }

  async function loadUserProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('nome_completo, company_id, whatsapp, endereco_padrao')
      .eq('id', user.id)
      .single()

    if (profile?.nome_completo) setRecipientName(profile.nome_completo)
    if (profile?.whatsapp) setWhatsapp(profile.whatsapp)

    // Auto-fill endereço salvo
    if (profile?.endereco_padrao) {
      const addr = profile.endereco_padrao as Record<string, string>
      setSavedAddress(addr)
      // Preenche automaticamente
      if (addr.cep) setCep(addr.cep)
      if (addr.logradouro) setLogradouro(addr.logradouro)
      if (addr.numero) setNumero(addr.numero)
      if (addr.complemento) setComplemento(addr.complemento)
      if (addr.bairro) setBairro(addr.bairro)
      if (addr.cidade) setCidade(addr.cidade)
      if (addr.uf) setUf(addr.uf)
      setShowSavedAddress(true)
    }

    // Preços especiais
    const { data: userPrices } = await supabase
      .from('company_prices').select('product_id, preco_especial').eq('user_id', user.id)
    if (userPrices && userPrices.length > 0) { setSpecialPrices(userPrices); }

    if (profile?.company_id) {
      const { data: companyPrices } = await supabase
        .from('company_prices').select('product_id, preco_especial').eq('company_id', profile.company_id)
      if (companyPrices && companyPrices.length > 0 && (!userPrices || userPrices.length === 0)) {
        setSpecialPrices(companyPrices)
      }

      // Verifica empresa faturada e carrega endereço da empresa
      const { data: company } = await supabase
        .from('companies').select('faturado, prazo_faturamento, endereco').eq('id', profile.company_id).single()
      if (company?.faturado) {
        setIsFaturado(true)
        setPrazoFaturamento(company.prazo_faturamento || 30)
      }
      // Auto-preenche com endereço da empresa se o perfil não tiver endereço salvo
      if (!profile?.endereco_padrao && company?.endereco) {
        const addr = company.endereco as Record<string, string>
        if (addr.logradouro) {
          if (addr.cep) setCep(addr.cep)
          if (addr.logradouro) setLogradouro(addr.logradouro)
          if (addr.numero) setNumero(addr.numero)
          if (addr.complemento) setComplemento(addr.complemento)
          if (addr.bairro) setBairro(addr.bairro)
          if (addr.cidade) setCidade(addr.cidade)
          if (addr.uf) setUf(addr.uf)
          setSavedAddress(addr)
          setShowSavedAddress(true)
        }
      }
    }
  }

  function applysaved() {
    if (!savedAddress) return
    setCep(savedAddress.cep || '')
    setLogradouro(savedAddress.logradouro || '')
    setNumero(savedAddress.numero || '')
    setComplemento(savedAddress.complemento || '')
    setBairro(savedAddress.bairro || '')
    setCidade(savedAddress.cidade || '')
    setUf(savedAddress.uf || '')
  }

  function clearAddress() {
    setCep(''); setLogradouro(''); setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setUf('')
    setShowSavedAddress(false)
  }

  async function fetchCEP(value: string) {
    const clean = value.replace(/\D/g, '')
    setCep(value)
    if (clean.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setLogradouro(data.logradouro || '')
          setBairro(data.bairro || '')
          setCidade(data.localidade || '')
          setUf(data.uf || '')
        } else toast.error('CEP não encontrado')
      } catch { toast.error('Erro ao buscar CEP') }
      finally { setCepLoading(false) }
    }
  }

  const fullAddress = [logradouro, numero, complemento, bairro, cidade, uf].filter(Boolean).join(', ')

  const canProceed = () => {
    if (step === 1) return branchId && logradouro && numero && cidade
    if (step === 2) return recipientName && whatsapp
    return true
  }

  // Mapeia passo real do form para step lógico (quando faturado pula pagamento)
  function getStepLabel(s: number) {
    return STEPS.find(x => x.id === s)?.label || ''
  }
  // Passo de confirmação é sempre o último
  const isConfirmStep = step === TOTAL_STEPS
  // Passo de pagamento é step 3 apenas quando não faturado
  const isPaymentStep = !isFaturado && step === 3

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const numeroStr = `GA${Date.now().toString().slice(-6)}`

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        numero_pedido: numeroStr,
        cliente_nome: recipientName,
        cliente_whatsapp: normalizePhone(whatsapp),
        endereco_completo: fullAddress,
        recebedor_nome: recipientName,
        recebedor_whatsapp: normalizePhone(whatsapp),
        recebedor_referencia: reference,
        endereco_cidade: cidade,
        endereco_estado: uf,
        observacoes: observations,
        subtotal: effectiveTotal,
        total: effectiveTotal,
        metodo_pagamento: isFaturado ? 'faturado' : paymentMethod,
        status: 'NOVO',
        branch_id: branchId || null,
        user_id: user?.id || null,
        prioridade: 'NORMAL',
      }).select().single()

      if (orderError || !order) throw orderError || new Error('Erro ao criar pedido')

      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.id,
          produto_nome: item.name,
          quantidade: item.qty,
          preco_unitario: getEffectivePrice(item.id, item.price),
          subtotal: getEffectivePrice(item.id, item.price) * item.qty,
        }))
      )

      // Salva endereço e whatsapp no perfil para próxima vez
      if (user) {
        await supabase.from('profiles').update({
          whatsapp: normalizePhone(whatsapp),
          endereco_padrao: { cep, logradouro, numero, complemento, bairro, cidade, uf },
        }).eq('id', user.id)
      }

      cartStore.clearCart()
      toast.success('Pedido realizado com sucesso! 🎉')
      router.push('/')
    } catch (err) {
      toast.error('Erro ao finalizar pedido. Tente novamente.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const copyPix = () => {
    navigator.clipboard.writeText(tenant.pix)
    toast.success('Chave PIX copiada!')
  }

  return (
    <div className="bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Finalizar Pedido</h1>
          {isFaturado && <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">📋 Faturado {prazoFaturamento}d</span>}
        </div>
        <div className="flex items-center mt-3 gap-1">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-1 flex-shrink-0 ${step > s.id ? 'text-[#2E7D32]' : step === s.id ? 'text-[#1565C0]' : 'text-gray-300'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${step > s.id ? 'bg-[#2E7D32] border-[#2E7D32] text-white' :
                    step === s.id ? 'bg-[#1565C0] border-[#1565C0] text-white' :
                    'bg-white border-gray-200 text-gray-400'}`}>
                  {step > s.id ? <Check size={14} /> : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${step > s.id + 1 ? 'bg-[#2E7D32]' : step > s.id ? 'bg-[#1565C0]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">

        {/* STEP 1 — Endereço */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-[#1565C0]" /> Filial de Atendimento
              </h2>
              <select value={branchId} onChange={e => setBranchId(e.target.value)} className="input-base">
                <option value="">Selecione uma filial</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>

            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={18} className="text-[#1565C0]" /> Endereço de Entrega
                </h2>
                {savedAddress && (
                  <div className="flex gap-2">
                    <button onClick={applysaved} className="text-xs text-[#1565C0] font-semibold flex items-center gap-1 hover:underline">
                      <RefreshCw size={12} /> Usar anterior
                    </button>
                    {showSavedAddress && (
                      <button onClick={clearAddress} className="text-xs text-gray-400 hover:underline">Limpar</button>
                    )}
                  </div>
                )}
              </div>

              {showSavedAddress && savedAddress && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-gray-700">
                  <p className="font-semibold text-blue-700 mb-1">Endereço anterior carregado</p>
                  <p>{[savedAddress.logradouro, savedAddress.numero, savedAddress.bairro, savedAddress.cidade, savedAddress.uf].filter(Boolean).join(', ')}</p>
                  <p className="text-gray-400 mt-0.5">Altere os campos abaixo se precisar de outro endereço</p>
                </div>
              )}

              <div className="relative">
                <input type="text" placeholder="CEP (somente números)" value={cep}
                  onChange={e => fetchCEP(e.target.value)} maxLength={9} className="input-base pr-10" />
                {cepLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input type="text" placeholder="Logradouro" value={logradouro}
                    onChange={e => setLogradouro(e.target.value)} className="input-base" />
                </div>
                <input type="text" placeholder="Número" value={numero}
                  onChange={e => setNumero(e.target.value)} className="input-base" />
              </div>
              <input type="text" placeholder="Complemento (opcional)" value={complemento}
                onChange={e => setComplemento(e.target.value)} className="input-base" />
              <input type="text" placeholder="Bairro" value={bairro}
                onChange={e => setBairro(e.target.value)} className="input-base" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input type="text" placeholder="Cidade" value={cidade}
                    onChange={e => setCidade(e.target.value)} className="input-base" />
                </div>
                <input type="text" placeholder="UF" value={uf}
                  onChange={e => setUf(e.target.value)} className="input-base" maxLength={2} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Destinatário */}
        {step === 2 && (
          <div className="card p-4 space-y-3 animate-slide-up">
            <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <User size={18} className="text-[#1565C0]" /> Dados do Destinatário
            </h2>
            <input type="text" placeholder="Nome completo *" value={recipientName}
              onChange={e => setRecipientName(e.target.value)} className="input-base" />
            <input type="tel" placeholder="WhatsApp *" value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)} className="input-base" />
            <input type="text" placeholder="Ponto de referência (opcional)" value={reference}
              onChange={e => setReference(e.target.value)} className="input-base" />
            <textarea placeholder="Observações (opcional)" value={observations}
              onChange={e => setObservations(e.target.value)} rows={3} className="input-base resize-none" />
          </div>
        )}

        {/* STEP 3 — Pagamento (apenas quando não faturado) */}
        {isPaymentStep && (
          <div className="space-y-3 animate-slide-up">
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={18} className="text-[#1565C0]" /> Forma de Pagamento
              </h2>
              <div className="space-y-2">
                {[
                  { value: 'pix', label: 'PIX', emoji: '⚡', desc: 'Instantâneo e sem taxas' },
                  { value: 'cartao', label: 'Cartão', emoji: '💳', desc: 'Débito ou crédito' },
                  { value: 'dinheiro', label: 'Dinheiro', emoji: '💵', desc: 'Pague na entrega' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setPaymentMethod(opt.value as typeof paymentMethod)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${paymentMethod === opt.value ? 'border-[#1565C0] bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <span className="text-2xl">{opt.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${paymentMethod === opt.value ? 'border-[#1565C0] bg-[#1565C0]' : 'border-gray-300'}`}>
                      {paymentMethod === opt.value && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'pix' && (
              <div className="card p-4 bg-green-50 border-green-200 animate-fade-in">
                <p className="font-bold text-[#2E7D32] mb-2">Chave PIX</p>
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl p-3">
                  <span className="flex-1 text-sm font-mono text-gray-700 break-all">{tenant.pix}</span>
                  <button onClick={copyPix} className="flex-shrink-0 bg-[#2E7D32] text-white p-2 rounded-lg hover:bg-[#1B5E20]">
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Realize o pagamento após confirmar e envie o comprovante pelo WhatsApp</p>
              </div>
            )}

            {paymentMethod === 'dinheiro' && (
              <div className="card p-4 animate-fade-in">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Precisa de troco para quanto?</label>
                <input type="number" placeholder="Ex: 50,00 (deixe em branco se não precisar)"
                  value={changeAmount} onChange={e => setChangeAmount(e.target.value)} className="input-base" />
              </div>
            )}
          </div>
        )}

        {/* STEP final — Confirmar */}
        {isConfirmStep && (
          <div className="space-y-4 animate-slide-up">
            {isFaturado && (
              <div className="card p-4 bg-blue-50 border border-blue-200">
                <p className="font-bold text-[#1565C0] flex items-center gap-2">📋 Faturamento em {prazoFaturamento} dias</p>
                <p className="text-xs text-gray-600 mt-1">Este pedido será faturado para sua empresa. Não é necessário pagamento no ato.</p>
              </div>
            )}
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3">Itens do Pedido</h2>
              <div className="space-y-2">
                {items.map(item => {
                  const effective = getEffectivePrice(item.id, item.price)
                  const hasDiscount = effective < item.price
                  return (
                    <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-[#1565C0] font-bold px-2 py-0.5 rounded-full">{item.qty}x</span>
                        <div>
                          <span className="text-sm text-gray-700">{item.name}</span>
                          {hasDiscount && <p className="text-xs text-gray-400 line-through">{formatCurrency(item.price)}/un</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(effective * item.qty)}</span>
                        {hasDiscount && <p className="text-xs text-[#2E7D32] font-medium">preço especial</p>}
                      </div>
                    </div>
                  )
                })}
                {discount > 0 && (
                  <div className="flex justify-between py-1 text-[#2E7D32]">
                    <span className="text-sm font-medium">Desconto aplicado</span>
                    <span className="text-sm font-bold">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-black text-[#1565C0]">{formatCurrency(effectiveTotal)}</span>
                </div>
              </div>
            </div>

            <div className="card p-4 space-y-2">
              <h2 className="font-bold text-gray-900 mb-1">Resumo da Entrega</h2>
              <div className="text-sm space-y-1.5 text-gray-600">
                <p><span className="font-medium">Destinatário:</span> {recipientName}</p>
                <p><span className="font-medium">WhatsApp:</span> {whatsapp}</p>
                <p><span className="font-medium">Endereço:</span> {fullAddress}</p>
                {reference && <p><span className="font-medium">Referência:</span> {reference}</p>}
                <p><span className="font-medium">Pagamento:</span> {isFaturado ? `Faturado ${prazoFaturamento} dias` : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão' : 'Dinheiro'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões fixos */}
      <div className="fixed bottom-[57px] left-0 right-0 z-30 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 py-3">
              <ChevronLeft size={18} /> Voltar
            </button>
          )}
          {!isConfirmStep ? (
            <button onClick={() => canProceed() ? setStep(s => s + 1) : toast.error('Preencha os campos obrigatórios')}
              className="btn-primary flex-1 py-3">
              Continuar <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 py-3 text-base">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Confirmando...</> : <>Confirmar Pedido ✓</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
