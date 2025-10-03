'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ConfiguracoesPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('webhook_url')
        .single();

      if (error) throw error;
      setWebhookUrl(data?.webhook_url || '');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({ webhook_url: webhookUrl || null })
        .eq('id', (await supabase.from('configuracoes').select('id').single()).data?.id);

      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  };

  const testarWebhook = async () => {
    if (!webhookUrl) {
      alert('Configure uma URL de webhook primeiro');
      return;
    }

    setTestando(true);
    try {
      const pedidoTeste = {
        produto: {
          id: 'test-id',
          nome: 'Produto Teste',
          preco_unitario: 10.0,
        },
        cliente: {
          nome: 'Cliente Teste',
          endereco: 'Endereço Teste, 123',
          telefone: '(00) 00000-0000',
          isEmpresa: false,
          nomeEmpresa: '',
        },
        quantidade: 1,
        preco_total: 10.0,
        observacoes: 'Este é um pedido de teste do webhook',
        data: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoTeste),
      });

      if (response.ok) {
        alert('Webhook testado com sucesso! Verifique o destino.');
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao testar webhook:', error);
      alert(`Erro ao testar webhook: ${error.message}`);
    } finally {
      setTestando(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Webhook de Pedidos</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure a URL para receber notificações de novos pedidos. Os pedidos serão enviados via POST com JSON.
        </p>

        <div className="space-y-4">
          <Input
            label="URL do Webhook"
            type="url"
            placeholder="https://seu-servidor.com/webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-semibold mb-2">Formato do Payload:</h3>
            <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`{
  "produto": {
    "id": "uuid",
    "nome": "Nome do Produto",
    "preco_unitario": 10.00
  },
  "cliente": {
    "nome": "Nome do Cliente",
    "endereco": "Endereço Completo",
    "telefone": "(00) 00000-0000",
    "isEmpresa": false,
    "nomeEmpresa": ""
  },
  "quantidade": 1,
  "preco_total": 10.00,
  "observacoes": "Observações do pedido",
  "data": "2024-01-01T00:00:00.000Z"
}`}
            </pre>
          </div>

          <div className="flex space-x-3">
            <Button onClick={salvarConfiguracoes} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              variant="secondary"
              onClick={testarWebhook}
              disabled={testando || !webhookUrl}
            >
              {testando ? 'Testando...' : 'Testar Webhook'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mt-6">
        <h2 className="text-xl font-semibold mb-4">Informações do Sistema</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Versão:</strong> 1.0.0</p>
          <p><strong>Framework:</strong> Next.js 15</p>
          <p><strong>Backend:</strong> Supabase</p>
          <p><strong>Senha Admin:</strong> admin123</p>
        </div>
      </div>
    </div>
  );
}
