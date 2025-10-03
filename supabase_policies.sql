-- Políticas RLS para o GloboAGUA
-- Execute este SQL no Supabase SQL Editor

-- ============================================
-- TABELA: produtos
-- ============================================

CREATE POLICY "Allow anon insert produtos" ON produtos
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon update produtos" ON produtos
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon select produtos" ON produtos
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon delete produtos" ON produtos
FOR DELETE TO anon, authenticated
USING (true);

-- ============================================
-- TABELA: empresas
-- ============================================

CREATE POLICY "Allow anon insert empresas" ON empresas
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon update empresas" ON empresas
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon select empresas" ON empresas
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon delete empresas" ON empresas
FOR DELETE TO anon, authenticated
USING (true);

-- ============================================
-- TABELA: administradores
-- ============================================

CREATE POLICY "Allow anon insert administradores" ON administradores
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon update administradores" ON administradores
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon select administradores" ON administradores
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon delete administradores" ON administradores
FOR DELETE TO anon, authenticated
USING (true);

-- ============================================
-- TABELA: precos_empresas
-- ============================================

CREATE POLICY "Allow anon insert precos_empresas" ON precos_empresas
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon update precos_empresas" ON precos_empresas
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon select precos_empresas" ON precos_empresas
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon delete precos_empresas" ON precos_empresas
FOR DELETE TO anon, authenticated
USING (true);

-- ============================================
-- TABELA: configuracoes
-- ============================================

CREATE POLICY "Allow anon insert configuracoes" ON configuracoes
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon update configuracoes" ON configuracoes
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon select configuracoes" ON configuracoes
FOR SELECT TO anon, authenticated
USING (true);

-- ============================================
-- TABELA: pedidos
-- ============================================

CREATE POLICY "Allow anon insert pedidos" ON pedidos
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon select pedidos" ON pedidos
FOR SELECT TO anon, authenticated
USING (true);
