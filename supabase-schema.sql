-- Criar tabelas para o sistema Globo Água

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    preco_base DECIMAL(10, 2) NOT NULL,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS administradores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    contato VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de preços especiais para empresas
CREATE TABLE IF NOT EXISTS precos_empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
    preco_especial DECIMAL(10, 2) NOT NULL,
    UNIQUE(empresa_id, produto_id)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_url TEXT,
    outras_configs JSONB DEFAULT '{}'::jsonb
);

-- Inserir configuração inicial
INSERT INTO configuracoes (webhook_url, outras_configs)
VALUES (NULL, '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- Tabela de pedidos (log)
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dados_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir admin padrão (senha: admin123)
-- Hash gerado com bcrypt para 'admin123'
INSERT INTO administradores (nome, email, login, senha_hash, ativo)
VALUES (
    'Administrador',
    'admin@globoagua.com',
    'admin',
    '$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli',
    true
)
ON CONFLICT (login) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_administradores_login ON administradores(login);
CREATE INDEX IF NOT EXISTS idx_administradores_email ON administradores(email);
CREATE INDEX IF NOT EXISTS idx_empresas_login ON empresas(login);
CREATE INDEX IF NOT EXISTS idx_precos_empresas_empresa ON precos_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_precos_empresas_produto ON precos_empresas(produto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE precos_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos (público pode ler produtos ativos)
CREATE POLICY "Produtos ativos são públicos" ON produtos
    FOR SELECT USING (ativo = true);

CREATE POLICY "Admin pode fazer tudo em produtos" ON produtos
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para administradores (apenas service role)
CREATE POLICY "Apenas service role pode gerenciar admins" ON administradores
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para empresas (apenas admin)
CREATE POLICY "Admin pode fazer tudo em empresas" ON empresas
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para precos_empresas (público pode ler)
CREATE POLICY "Preços especiais são públicos" ON precos_empresas
    FOR SELECT USING (true);

CREATE POLICY "Admin pode fazer tudo em preços" ON precos_empresas
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para configuracoes (apenas admin)
CREATE POLICY "Admin pode fazer tudo em configurações" ON configuracoes
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas RLS para pedidos (público pode criar, admin pode ler)
CREATE POLICY "Qualquer um pode criar pedidos" ON pedidos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode ler pedidos" ON pedidos
    FOR SELECT USING (auth.role() = 'service_role');

-- Criar storage bucket para fotos de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT DO NOTHING;

-- Política de storage para produtos (público pode ler, admin pode fazer tudo)
CREATE POLICY "Público pode ver fotos de produtos" ON storage.objects
    FOR SELECT USING (bucket_id = 'produtos');

CREATE POLICY "Admin pode fazer tudo em fotos de produtos" ON storage.objects
    FOR ALL USING (bucket_id = 'produtos' AND auth.role() = 'service_role');
