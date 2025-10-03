import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface EmpresaAuth {
  id: string;
  nome: string;
  login: string;
}

export async function loginEmpresa(login: string, senha: string): Promise<EmpresaAuth | null> {
  try {
    const { data: empresa, error } = await supabase
      .from('empresas')
      .select('id, nome, login, senha_hash')
      .eq('login', login)
      .single();

    if (error || !empresa) {
      return null;
    }

    const senhaValida = await bcrypt.compare(senha, empresa.senha_hash);

    if (!senhaValida) {
      return null;
    }

    return {
      id: empresa.id,
      nome: empresa.nome,
      login: empresa.login,
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return null;
  }
}

export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}
