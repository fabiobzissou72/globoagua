'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type DriverLocation = {
  driver_id: string
  lat: number
  lng: number
  updated_at: string
  driver_name?: string
}

function getMarkerStatus(updatedAt: string): 'green' | 'yellow' | 'red' {
  const diffMin = (Date.now() - new Date(updatedAt).getTime()) / 60000
  if (diffMin < 2) return 'green'
  if (diffMin < 10) return 'yellow'
  return 'red'
}

const STATUS_COLORS = { green: '#2E7D32', yellow: '#F57C00', red: '#D32F2F' }
const STATUS_LABELS = { green: 'Ativo', yellow: 'Inativo', red: 'Desconectado' }

const LeafletMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-400 text-center">
        <div className="w-8 h-8 border-4 border-[#1565C0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Carregando mapa...</p>
      </div>
    </div>
  ),
})

export default function RastreamentoPage() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([])
  const [selected, setSelected] = useState<DriverLocation | null>(null)

  useEffect(() => {
    loadDrivers()
    const supabase = createClient()
    // Nome único evita conflito no React Strict Mode (double-invoke)
    const channel = supabase
      .channel(`driver-locs-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, payload => {
        setDrivers(prev => {
          const updated = payload.new as DriverLocation
          const exists = prev.find(d => d.driver_id === updated.driver_id)
          if (exists) return prev.map(d => d.driver_id === updated.driver_id ? updated : d)
          return [...prev, updated]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadDrivers() {
    const supabase = createClient()
    const { data } = await supabase.from('driver_locations').select('*')
    if (data) setDrivers(data)
  }

  return (
    <div className="flex flex-col md:flex-row md:h-full">
      {/* Panel — tira horizontal no mobile, sidebar no desktop */}
      <aside className="bg-white border-b md:border-b-0 md:border-r flex-shrink-0 md:w-64 flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="font-bold text-gray-900 text-sm">Entregadores</h2>
          <p className="text-xs text-gray-500">{drivers.length} rastreados</p>
        </div>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto flex-shrink-0 md:flex-1 p-2 md:p-3 gap-2 md:gap-0 md:space-y-2">
          {drivers.length === 0 ? (
            <p className="text-sm text-gray-400 whitespace-nowrap md:whitespace-normal py-2 md:py-8 px-2 md:text-center w-full">
              Nenhum online
            </p>
          ) : drivers.map(driver => {
            const status = getMarkerStatus(driver.updated_at)
            return (
              <button
                key={driver.driver_id}
                onClick={() => setSelected(driver)}
                className={`flex-shrink-0 md:w-full text-left p-2 md:p-3 rounded-xl border-2 transition-all min-w-[130px] md:min-w-0
                  ${selected?.driver_id === driver.driver_id ? 'border-[#1565C0] bg-blue-50' : 'border-transparent bg-gray-50 hover:border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 pulse-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  <p className="font-semibold text-xs text-gray-900 truncate">{driver.driver_name || 'Entregador'}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 hidden md:block">{STATUS_LABELS[status]}</p>
                <p className="text-xs text-gray-400 hidden md:block">{formatDate(driver.updated_at)}</p>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Mapa */}
      <div className="flex-1 relative min-h-[60vh] md:min-h-0">
        <LeafletMap drivers={drivers} selected={selected} onSelect={setSelected} />
      </div>
    </div>
  )
}
