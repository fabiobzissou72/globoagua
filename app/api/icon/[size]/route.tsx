import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const s = parseInt(size) || 192
  const radius = Math.round(s * 0.18)

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          background: '#1565C0',
          borderRadius: radius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 900,
          fontSize: Math.round(s * 0.38),
          color: 'white',
        }}
      >
        GA
      </div>
    ),
    { width: s, height: s }
  )
}
