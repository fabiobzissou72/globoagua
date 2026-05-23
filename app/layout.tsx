import type { Metadata, Viewport } from 'next'
import './globals.css'
import tenant from '@/tenant.config'
import Script from 'next/script'

export const metadata: Metadata = {
  title: tenant.seoTitle,
  description: tenant.seoDescription,
  keywords: tenant.seoKeywords,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: tenant.name,
  },
  icons: {
    icon: '/api/icon/192',
    apple: '/api/icon/192',
  },
}

export const viewport: Viewport = {
  themeColor: '#1565C0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/api/icon/192" />
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: 'nextjs-portal{display:none!important}' }} />
      </head>
      <body className="min-h-full">
        {children}
        {process.env.NODE_ENV === 'production' && (
          <Script id="sw-register" strategy="afterInteractive">{`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `}</Script>
        )}
      </body>
    </html>
  )
}
