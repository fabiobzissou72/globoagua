'use client';

import { EmpresaProvider } from '@/app/contexts/EmpresaContext';
import { InstallPWA } from '@/components/InstallPWA';
import Image from 'next/image';
import Link from 'next/link';
import { useEmpresa } from '@/app/contexts/EmpresaContext';

function Header() {
  const { empresa, logout } = useEmpresa();

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-40">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.jpg"
              alt="Globo Água"
              width={60}
              height={60}
              className="rounded-full"
            />
            <h1 className="text-3xl font-bold">Globo Água</h1>
          </Link>

          <div className="flex items-center space-x-4">
            {empresa ? (
              <>
                <span className="text-sm">Olá, {empresa.nome}</span>
                <button
                  onClick={logout}
                  className="text-sm hover:underline"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-white text-primary px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Login Empresas
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmpresaProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="container-custom text-center">
            <p>&copy; {new Date().getFullYear()} Globo Água. Todos os direitos reservados.</p>
          </div>
        </footer>
        <InstallPWA />
      </div>
    </EmpresaProvider>
  );
}
