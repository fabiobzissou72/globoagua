'use client'

import { useEffect, useRef } from 'react'

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

export default function MapComponent({ drivers, selected, onSelect }: {
  drivers: DriverLocation[]
  selected: DriverLocation | null
  onSelect: (d: DriverLocation) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || mapInstanceRef.current) return

      delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { maxZoom: 22 }).setView([-23.5505, -46.6333], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 22,
        maxNativeZoom: 19,
      }).addTo(map)
      mapInstanceRef.current = map
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then(L => {
      const map = mapInstanceRef.current!
      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!drivers.find(d => d.driver_id === id)) {
          map.removeLayer(marker)
          markersRef.current.delete(id)
        }
      })

      drivers.forEach(driver => {
        const status = getMarkerStatus(driver.updated_at)
        const color = STATUS_COLORS[status]
        const icon = L.divIcon({
          html: `<div style="
            background:${color};
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
            display:flex;align-items:center;justify-content:center;
          "><div style="transform:rotate(45deg);color:white;font-size:14px;">🚚</div></div>
          <div style="
            position:absolute;top:-24px;left:50%;transform:translateX(-50%);
            background:${color};color:white;font-size:10px;font-weight:bold;
            padding:2px 6px;border-radius:8px;white-space:nowrap;
            box-shadow:0 1px 4px rgba(0,0,0,.2);
          ">${driver.driver_name || 'Entregador'}</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -38],
        })

        const existing = markersRef.current.get(driver.driver_id)
        if (existing) {
          existing.setLatLng([driver.lat, driver.lng])
          existing.setIcon(icon)
        } else {
          const marker = L.marker([driver.lat, driver.lng], { icon })
            .addTo(map)
            .on('click', () => onSelect(driver))
          markersRef.current.set(driver.driver_id, marker)
        }
      })
    })
  }, [drivers, onSelect])

  useEffect(() => {
    if (!selected || !mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([selected.lat, selected.lng], 18, { duration: 1 })
  }, [selected])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
    </div>
  )
}
