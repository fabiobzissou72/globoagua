-- Corrige acesso público aos produtos
-- Cole no Supabase SQL Editor e execute

-- Remove todas as policies existentes de products
DROP POLICY IF EXISTS "products_read" ON public.products;
DROP POLICY IF EXISTS "products_policy" ON public.products;
DROP POLICY IF EXISTS "products_admin" ON public.products;

-- Desativa RLS temporariamente e reativa (limpa qualquer estado)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política simples: qualquer pessoa pode ler produtos ativos
CREATE POLICY "produtos_publico" ON public.products
  FOR SELECT USING (ativo = true);

-- Verifica se funcionou (deve retornar os produtos)
SELECT count(*) as total_produtos FROM public.products WHERE ativo = true;
