'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function ResetAdminPage() {
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);

  const resetarSenha = async () => {
    setLoading(true);
    setResultado('');

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResultado('✅ Senha resetada com sucesso!\n\nLogin: admin\nSenha: admin123');
      } else {
        setResultado(`❌ Erro: ${data.error}\n${data.details || ''}\n${data.hint || ''}`);
      }
    } catch (error) {
      setResultado(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Resetar Senha Admin</h1>
        <p className="text-gray-600 mb-6">
          Clique no botão abaixo para resetar a senha do admin para "admin123"
        </p>

        <Button onClick={resetarSenha} disabled={loading} className="w-full mb-4">
          {loading ? 'Resetando...' : 'Resetar Senha'}
        </Button>

        {resultado && (
          <div className={`p-4 rounded ${resultado.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <pre className="whitespace-pre-wrap text-sm">{resultado}</pre>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p className="font-semibold">Se não funcionar:</p>
          <p>Acesse Supabase Dashboard → SQL Editor e execute:</p>
          <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
{`UPDATE administradores
SET senha_hash = '$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli'
WHERE login = 'admin';`}
          </pre>
        </div>
      </div>
    </div>
  );
}
