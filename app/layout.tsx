import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RegisterSW } from './register-sw';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Globo Água - Sistema de Pedidos',
  description: 'Sistema de pedidos online da Globo Água',
  manifest: '/manifest.json',
  themeColor: '#0066CC',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Globo Água',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
