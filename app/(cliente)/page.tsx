'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/app/contexts/EmpresaContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import Image from 'next/image';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco_base: number;
  foto_url: string | null;
  preco_empresa?: number;
}

interface PedidoForm {
  nome: string;
  endereco: string;
  isEmpresa: boolean;
  nomeEmpresa: string;
  telefone: string;
  observacoes: string;
  quantidade: number;
}

export default function HomePage() {
  const { empresa, isLoading: empresaLoading } = useEmpresa();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [pedidoForm, setPedidoForm] = useState<PedidoForm>({
    nome: '',
    endereco: '',
    isEmpresa: false,
    nomeEmpresa: '',
    telefone: '',
    observacoes: '',
    quantidade: 1,
  });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!empresaLoading) {
      carregarProdutos();
    }
  }, [empresa, empresaLoading]);

  const carregarProdutos = async () => {
    try {
      setLoading(true);

      // Buscar produtos ativos
      const { data: produtosData, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      // Se tiver empresa logada, buscar preços especiais
      if (empresa && produtosData) {
        const { data: precosData } = await supabase
          .from('precos_empresas')
          .select('produto_id, preco_especial')
          .eq('empresa_id', empresa.id);

        const precosMap = new Map(
          precosData?.map((p) => [p.produto_id, p.preco_especial]) || []
        );

        const produtosComPreco = produtosData.map((produto) => ({
          ...produto,
          preco_empresa: precosMap.get(produto.id),
        }));

        setProdutos(produtosComPreco);
      } else {
        setProdutos(produtosData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const abrirModalPedido = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setPedidoForm({
      nome: '',
      endereco: '',
      isEmpresa: false,
      nomeEmpresa: '',
      telefone: '',
      observacoes: '',
      quantidade: 1,
    });
    setModalOpen(true);
  };

  const handleSubmitPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoSelecionado) return;

    setEnviando(true);

    try {
      const preco = produtoSelecionado.preco_empresa || produtoSelecionado.preco_base;
      const precoTotal = preco * pedidoForm.quantidade;

      const pedidoData = {
        produto: {
          id: produtoSelecionado.id,
          nome: produtoSelecionado.nome,
          preco_unitario: preco,
        },
        cliente: {
          nome: pedidoForm.nome,
          endereco: pedidoForm.endereco,
          telefone: pedidoForm.telefone,
          isEmpresa: pedidoForm.isEmpresa,
          nomeEmpresa: pedidoForm.nomeEmpresa,
        },
        quantidade: pedidoForm.quantidade,
        preco_total: precoTotal,
        observacoes: pedidoForm.observacoes,
        data: new Date().toISOString(),
      };

      // Enviar pedido via API
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      });

      if (response.ok) {
        alert('Pedido enviado com sucesso!');
        setModalOpen(false);
      } else {
        throw new Error('Erro ao enviar pedido');
      }
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const getPrecoExibicao = (produto: Produto) => {
    return produto.preco_empresa || produto.preco_base;
  };

  if (loading || empresaLoading) {
    return (
      <div className="container-custom py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Produtos</h2>
        <Input
          type="search"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        {empresa && (
          <p className="mt-2 text-sm text-green-600">
            ✓ Você está vendo preços especiais para {empresa.nome}
          </p>
        )}
      </div>

      {produtosFiltrados.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {produto.foto_url ? (
                <div className="relative h-48 w-full">
                  <Image
                    src={produto.foto_url}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {produto.nome}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {produto.descricao}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(getPrecoExibicao(produto))}
                    </p>
                    {produto.preco_empresa && (
                      <p className="text-xs text-gray-500 line-through">
                        {formatPrice(produto.preco_base)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => abrirModalPedido(produto)}
                    size="sm"
                  >
                    Pedir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Fazer Pedido"
        size="md"
      >
        {produtoSelecionado && (
          <form onSubmit={handleSubmitPedido} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{produtoSelecionado.nome}</p>
              <p className="text-sm text-gray-600">{produtoSelecionado.descricao}</p>
              <p className="text-xl font-bold text-primary mt-2">
                {formatPrice(getPrecoExibicao(produtoSelecionado))}
              </p>
            </div>

            <Input
              label="Nome Completo"
              required
              value={pedidoForm.nome}
              onChange={(e) => setPedidoForm({ ...pedidoForm, nome: e.target.value })}
            />

            <Input
              label="Endereço Completo"
              required
              value={pedidoForm.endereco}
              onChange={(e) => setPedidoForm({ ...pedidoForm, endereco: e.target.value })}
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEmpresa"
                checked={pedidoForm.isEmpresa}
                onChange={(e) => setPedidoForm({ ...pedidoForm, isEmpresa: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isEmpresa" className="text-sm font-medium text-gray-700">
                É empresa?
              </label>
            </div>

            {pedidoForm.isEmpresa && (
              <Input
                label="Nome da Empresa"
                required
                value={pedidoForm.nomeEmpresa}
                onChange={(e) => setPedidoForm({ ...pedidoForm, nomeEmpresa: e.target.value })}
              />
            )}

            <Input
              label="Telefone/WhatsApp"
              type="tel"
              required
              value={pedidoForm.telefone}
              onChange={(e) => setPedidoForm({ ...pedidoForm, telefone: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={pedidoForm.observacoes}
                onChange={(e) => setPedidoForm({ ...pedidoForm, observacoes: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            <Input
              label="Quantidade"
              type="number"
              min="1"
              required
              value={pedidoForm.quantidade}
              onChange={(e) => setPedidoForm({ ...pedidoForm, quantidade: parseInt(e.target.value) || 1 })}
            />

            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-lg font-semibold">
                Total: {formatPrice(getPrecoExibicao(produtoSelecionado) * pedidoForm.quantidade)}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={enviando}
                className="flex-1"
              >
                {enviando ? 'Enviando...' : 'Enviar Pedido'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
