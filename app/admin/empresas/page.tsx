'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Empresa {
  id: string;
  nome: string;
  login: string;
  contato: string;
  telefone: string;
}

interface Produto {
  id: string;
  nome: string;
  preco_base: number;
}

interface PrecoEmpresa {
  produto_id: string;
  preco_especial: number;
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrecosOpen, setModalPrecosOpen] = useState(false);
  const [editando, setEditando] = useState<Empresa | null>(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    login: '',
    senha: '',
    contato: '',
    telefone: '',
  });
  const [precos, setPrecos] = useState<PrecoEmpresa[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [empresasRes, produtosRes] = await Promise.all([
        supabase.from('empresas').select('*').order('nome'),
        supabase.from('produtos').select('id, nome, preco_base').eq('ativo', true).order('nome'),
      ]);

      setEmpresas(empresasRes.data || []);
      setProdutos(produtosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (empresa?: Empresa) => {
    if (empresa) {
      setEditando(empresa);
      setFormData({
        nome: empresa.nome,
        login: empresa.login,
        senha: '',
        contato: empresa.contato,
        telefone: empresa.telefone,
      });
    } else {
      setEditando(null);
      setFormData({
        nome: '',
        login: '',
        senha: '',
        contato: '',
        telefone: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const dadosEmpresa: any = {
        nome: formData.nome,
        login: formData.login,
        contato: formData.contato,
        telefone: formData.telefone,
      };

      // Hash da senha se foi fornecida
      if (formData.senha) {
        dadosEmpresa.senha_hash = await hashPassword(formData.senha);
      }

      if (editando) {
        // Não atualiza senha se estiver vazia
        if (!formData.senha) {
          delete dadosEmpresa.senha_hash;
        }

        const { error } = await supabase
          .from('empresas')
          .update(dadosEmpresa)
          .eq('id', editando.id);

        if (error) throw error;
      } else {
        if (!formData.senha) {
          alert('Senha é obrigatória para nova empresa');
          setSalvando(false);
          return;
        }

        const { error } = await supabase
          .from('empresas')
          .insert(dadosEmpresa);

        if (error) throw error;
      }

      await carregarDados();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      alert(error.message || 'Erro ao salvar empresa');
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await carregarDados();
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      alert('Erro ao deletar empresa');
    }
  };

  const abrirModalPrecos = async (empresa: Empresa) => {
    setEmpresaSelecionada(empresa);

    try {
      const { data } = await supabase
        .from('precos_empresas')
        .select('produto_id, preco_especial')
        .eq('empresa_id', empresa.id);

      setPrecos(data || []);
      setModalPrecosOpen(true);
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    }
  };

  const handlePrecoChange = (produtoId: string, preco: string) => {
    const precoNum = parseFloat(preco);
    if (isNaN(precoNum)) return;

    setPrecos((prev) => {
      const index = prev.findIndex((p) => p.produto_id === produtoId);
      if (index >= 0) {
        const newPrecos = [...prev];
        newPrecos[index] = { produto_id: produtoId, preco_especial: precoNum };
        return newPrecos;
      } else {
        return [...prev, { produto_id: produtoId, preco_especial: precoNum }];
      }
    });
  };

  const salvarPrecos = async () => {
    if (!empresaSelecionada) return;

    setSalvando(true);
    try {
      // Deletar preços antigos
      await supabase
        .from('precos_empresas')
        .delete()
        .eq('empresa_id', empresaSelecionada.id);

      // Inserir novos preços
      const precosParaSalvar = precos
        .filter((p) => p.preco_especial > 0)
        .map((p) => ({
          empresa_id: empresaSelecionada.id,
          produto_id: p.produto_id,
          preco_especial: p.preco_especial,
        }));

      if (precosParaSalvar.length > 0) {
        const { error } = await supabase
          .from('precos_empresas')
          .insert(precosParaSalvar);

        if (error) throw error;
      }

      alert('Preços salvos com sucesso!');
      setModalPrecosOpen(false);
    } catch (error) {
      console.error('Erro ao salvar preços:', error);
      alert('Erro ao salvar preços');
    } finally {
      setSalvando(false);
    }
  };

  const getPrecoEspecial = (produtoId: string) => {
    const preco = precos.find((p) => p.produto_id === produtoId);
    return preco?.preco_especial || 0;
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
        <Button onClick={() => abrirModal()}>+ Nova Empresa</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {empresas.map((empresa) => (
              <tr key={empresa.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {empresa.nome}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {empresa.login}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {empresa.contato}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {empresa.telefone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => abrirModal(empresa)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => abrirModalPrecos(empresa)}
                  >
                    Preços
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(empresa.id)}
                  >
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Empresa' : 'Nova Empresa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome da Empresa"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />

          <Input
            label="Login"
            required
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          />

          <Input
            label={editando ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha'}
            type="password"
            required={!editando}
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
          />

          <Input
            label="Contato"
            required
            value={formData.contato}
            onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
          />

          <Input
            label="Telefone"
            type="tel"
            required
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="flex-1">
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalPrecosOpen}
        onClose={() => setModalPrecosOpen(false)}
        title={`Preços Especiais - ${empresaSelecionada?.nome}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Configure os preços especiais para esta empresa. Deixe em 0 para usar o preço base.
          </p>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {produtos.map((produto) => (
              <div key={produto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-sm">{produto.nome}</p>
                  <p className="text-xs text-gray-500">
                    Preço base: {formatPrice(produto.preco_base)}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={getPrecoEspecial(produto.id) || ''}
                    onChange={(e) => handlePrecoChange(produto.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalPrecosOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={salvarPrecos} disabled={salvando} className="flex-1">
              {salvando ? 'Salvando...' : 'Salvar Preços'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
