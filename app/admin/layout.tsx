'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AdminData {
  id: string;
  nome: string;
  email: string;
  login: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [autenticado, setAutenticado] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [formData, setFormData] = useState({ login: '', senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const adminStorage = localStorage.getItem('adminData');
    if (adminStorage) {
      try {
        setAdminData(JSON.parse(adminStorage));
        setAutenticado(true);
      } catch (e) {
        console.error('Erro ao carregar admin:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        setAdminData(data.admin);
        setAutenticado(true);
      } else {
        setErro(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminData');
    setAutenticado(false);
    setAdminData(null);
    router.push('/admin');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Admin - Globo Água</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Login"
              type="text"
              required
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              placeholder="Digite seu login"
            />
            <Input
              label="Senha"
              type="password"
              required
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Digite sua senha"
            />
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {erro}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Login padrão: <strong>admin</strong></p>
            <p>Senha padrão: <strong>admin123</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/produtos', label: 'Produtos', icon: '📦' },
    { href: '/admin/empresas', label: 'Empresas', icon: '🏢' },
    { href: '/admin/administradores', label: 'Admins', icon: '👥' },
    { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">Globo Água - Admin</h1>
              <div className="hidden md:flex space-x-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-primary-dark'
                        : 'hover:bg-primary-dark'
                    }`}
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Olá, {adminData?.nome}</span>
              <Link href="/" className="text-sm hover:underline">
                Ver Site
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
