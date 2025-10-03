'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Administrador {
  id: string;
  nome: string;
  email: string;
  login: string;
  ativo: boolean;
  created_at: string;
}

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    login: '',
    senha: '',
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarAdmins();
  }, []);

  const carregarAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('administradores')
        .select('*')
        .order('nome');

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (admin?: Administrador) => {
    if (admin) {
      setEditando(admin);
      setFormData({
        nome: admin.nome,
        email: admin.email,
        login: admin.login,
        senha: '',
      });
    } else {
      setEditando(null);
      setFormData({
        nome: '',
        email: '',
        login: '',
        senha: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const dadosAdmin: any = {
        nome: formData.nome,
        email: formData.email,
        login: formData.login,
      };

      if (formData.senha) {
        dadosAdmin.senha_hash = await hashPassword(formData.senha);
      }

      if (editando) {
        if (!formData.senha) {
          delete dadosAdmin.senha_hash;
        }

        const { data, error } = await supabase
          .from('administradores')
          .update(dadosAdmin)
          .eq('id', editando.id)
          .select();

        if (error) {
          console.error('Erro ao atualizar administrador:', error);
          throw new Error(error.message || 'Erro ao atualizar administrador');
        }
      } else {
        if (!formData.senha) {
          alert('Senha é obrigatória para novo administrador');
          setSalvando(false);
          return;
        }

        const { data, error } = await supabase
          .from('administradores')
          .insert(dadosAdmin)
          .select();

        if (error) {
          console.error('Erro ao inserir administrador:', error);
          throw new Error(error.message || 'Erro ao inserir administrador');
        }
      }

      await carregarAdmins();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar administrador:', error);
      alert(error.message || 'Erro ao salvar administrador');
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este administrador?')) return;

    try {
      const { error } = await supabase
        .from('administradores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await carregarAdmins();
    } catch (error) {
      console.error('Erro ao deletar administrador:', error);
      alert('Erro ao deletar administrador');
    }
  };

  const toggleAtivo = async (admin: Administrador) => {
    try {
      const { error } = await supabase
        .from('administradores')
        .update({ ativo: !admin.ativo })
        .eq('id', admin.id);

      if (error) throw error;
      await carregarAdmins();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Administradores</h1>
        <Button onClick={() => abrirModal()}>+ Novo Administrador</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {admin.nome}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {admin.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {admin.login}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleAtivo(admin)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      admin.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {admin.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => abrirModal(admin)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(admin.id)}
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
        title={editando ? 'Editar Administrador' : 'Novo Administrador'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
    </div>
  );
}
