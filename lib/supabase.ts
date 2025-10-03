import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTANDO');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'OK' : 'FALTANDO');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export type Database = {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string;
          nome: string;
          descricao: string;
          preco_base: number;
          foto_url: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          descricao: string;
          preco_base: number;
          foto_url?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          descricao?: string;
          preco_base?: number;
          foto_url?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
      };
      administradores: {
        Row: {
          id: string;
          nome: string;
          email: string;
          login: string;
          senha_hash: string;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          login: string;
          senha_hash: string;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          login?: string;
          senha_hash?: string;
          ativo?: boolean;
          created_at?: string;
        };
      };
      empresas: {
        Row: {
          id: string;
          nome: string;
          login: string;
          senha_hash: string;
          contato: string;
          telefone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          login: string;
          senha_hash: string;
          contato: string;
          telefone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          login?: string;
          senha_hash?: string;
          contato?: string;
          telefone?: string;
          created_at?: string;
        };
      };
      precos_empresas: {
        Row: {
          id: string;
          empresa_id: string;
          produto_id: string;
          preco_especial: number;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          produto_id: string;
          preco_especial: number;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          produto_id?: string;
          preco_especial?: number;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          webhook_url: string | null;
          outras_configs: any;
        };
        Insert: {
          id?: string;
          webhook_url?: string | null;
          outras_configs?: any;
        };
        Update: {
          id?: string;
          webhook_url?: string | null;
          outras_configs?: any;
        };
      };
      pedidos: {
        Row: {
          id: string;
          dados_json: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          dados_json: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          dados_json?: any;
          created_at?: string;
        };
      };
    };
  };
};
