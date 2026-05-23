import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const s = parseInt(size) || 192

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${s * 0.18}" fill="#1565C0"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial,sans-serif" font-weight="900" font-size="${s * 0.38}"
    fill="white">GA</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
