'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface Stats {
  totalProdutos: number;
  produtosAtivos: number;
  totalEmpresas: number;
  totalPedidos: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProdutos: 0,
    produtosAtivos: 0,
    totalEmpresas: 0,
    totalPedidos: 0,
  });
  const [pedidosRecentes, setPedidosRecentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtos, empresas, pedidos] = await Promise.all([
        supabase.from('produtos').select('ativo'),
        supabase.from('empresas').select('id'),
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      setStats({
        totalProdutos: produtos.data?.length || 0,
        produtosAtivos: produtos.data?.filter((p) => p.ativo).length || 0,
        totalEmpresas: empresas.data?.length || 0,
        totalPedidos: pedidos.data?.length || 0,
      });

      setPedidosRecentes(pedidos.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total de Produtos</h3>
          <p className="text-3xl font-bold text-primary mt-2">{stats.totalProdutos}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.produtosAtivos} ativos</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Empresas Cadastradas</h3>
          <p className="text-3xl font-bold text-primary mt-2">{stats.totalEmpresas}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-primary mt-2">{stats.totalPedidos}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Status do Sistema</h3>
          <p className="text-lg font-semibold text-green-600 mt-2">✓ Online</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidosRecentes.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(pedido.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {pedido.dados_json.cliente.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {pedido.dados_json.produto.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pedido.dados_json.quantidade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {pedido.dados_json.preco_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
