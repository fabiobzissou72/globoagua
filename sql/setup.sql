-- ============================================================
-- GLOBO ÁGUA - Setup banco de dados
-- Cole no Supabase SQL Editor e execute
-- ============================================================

-- Dropa APENAS o trigger externo (auth.users nao e dropado)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Dropa tabelas com CASCADE (remove triggers das tabelas automaticamente)
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.company_prices CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.user_addresses CASCADE;
DROP TABLE IF EXISTS public.user_passkeys CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Dropa funcoes
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome_completo text DEFAULT '',
  whatsapp text DEFAULT '',
  tipo_pessoa text DEFAULT 'PF',
  documento text DEFAULT '',
  razao_social text DEFAULT '',
  nome_fantasia text DEFAULT '',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text DEFAULT '',
  device_name text DEFAULT 'Dispositivo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  cep text DEFAULT '', rua text DEFAULT '', numero text DEFAULT '',
  complemento text DEFAULT '', bairro text DEFAULT '',
  cidade text DEFAULT '', estado text DEFAULT '',
  referencia text DEFAULT '', is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text DEFAULT '',
  foto_url text DEFAULT '',
  categoria text DEFAULT 'Bebidas',
  preco_padrao decimal(10,2) DEFAULT 0,
  estoque integer DEFAULT 999,
  ativo boolean DEFAULT true,
  destaque boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL UNIQUE,
  razao_social text NOT NULL,
  nome_fantasia text DEFAULT '',
  contato text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.company_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies ON DELETE CASCADE,
  cnpj text NOT NULL,
  product_id uuid REFERENCES public.products ON DELETE CASCADE,
  preco_especial decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cnpj, product_id)
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users,
  cliente_nome text DEFAULT '', cliente_email text DEFAULT '',
  cliente_whatsapp text DEFAULT '', cliente_tipo text DEFAULT 'PF',
  cliente_documento text DEFAULT '',
  endereco_completo text DEFAULT '', endereco_cidade text DEFAULT '',
  endereco_estado text DEFAULT '',
  recebedor_nome text DEFAULT '', recebedor_whatsapp text DEFAULT '',
  recebedor_referencia text DEFAULT '',
  subtotal decimal(10,2) DEFAULT 0, taxa_entrega decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  status text DEFAULT 'NOVO', status_pagamento text DEFAULT 'PENDENTE',
  metodo_pagamento text DEFAULT '',
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  pago_at timestamptz, entregue_at timestamptz
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders ON DELETE CASCADE,
  product_id uuid REFERENCES public.products,
  produto_nome text DEFAULT '', produto_foto_url text DEFAULT '',
  preco_unitario decimal(10,2) DEFAULT 0,
  quantidade integer DEFAULT 1, subtotal decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders ON DELETE CASCADE,
  status_anterior text, status_novo text NOT NULL,
  changed_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders,
  attempt_number integer DEFAULT 1, status_code integer,
  request_body jsonb, response_body text, error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.settings (
  key text PRIMARY KEY, value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- FUNCOES E TRIGGERS
-- ============================================================

CREATE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER t_products_upd BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER t_orders_upd BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v boolean;
BEGIN
  SELECT is_admin INTO v FROM public.profiles WHERE id = auth.uid();
  RETURN coalesce(v, false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles(id, nome_completo, whatsapp, tipo_pessoa, documento)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_completo', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(new.raw_user_meta_data->>'tipo_pessoa', 'PF'),
    coalesce(new.raw_user_meta_data->>'documento', '')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SETTINGS
-- ============================================================

INSERT INTO public.settings(key, value) VALUES
  ('geral', '{"nome_loja":"Globo Agua","whatsapp_suporte":"","cor_primaria":"#1976D2"}'),
  ('entrega', '{"tipo":"gratis","valor_fixo":0}'),
  ('webhook_speedit', '{"url":"","token":""}'),
  ('gateway_pagamento', '{"provedor":"mercadopago","public_key":"","access_token":"","modo":"sandbox"}');

-- ============================================================
-- PRODUTOS INICIAIS
-- ============================================================

INSERT INTO public.products(nome, descricao, categoria, preco_padrao, ativo, destaque) VALUES
  ('Agua Mineral 500ml', 'Agua mineral natural 500ml', 'Agua', 2.50, true, false),
  ('Agua Mineral 1,5L', 'Agua mineral natural 1,5 litros', 'Agua', 4.00, true, true),
  ('Agua Mineral 5L', 'Agua mineral natural 5 litros', 'Agua', 8.00, true, true),
  ('Galao 20L', 'Galao de agua mineral 20 litros', 'Agua', 22.00, true, true),
  ('Agua com Gas 500ml', 'Agua mineral com gas 500ml', 'Agua', 3.00, true, false),
  ('Coca-Cola Lata 350ml', 'Refrigerante Coca-Cola lata', 'Refrigerantes', 5.00, true, false),
  ('Coca-Cola 2L', 'Refrigerante Coca-Cola 2 litros', 'Refrigerantes', 12.00, true, false),
  ('Guarana Antarctica Lata', 'Guarana Antarctica 350ml', 'Refrigerantes', 4.50, true, false),
  ('Red Bull 250ml', 'Energetico Red Bull 250ml', 'Energeticos', 12.00, true, true),
  ('Suco de Laranja 1L', 'Suco de laranja 1 litro', 'Bebidas', 9.00, true, false);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "passkeys_self" ON public.user_passkeys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "addresses_self" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "products_read" ON public.products FOR SELECT USING (ativo = true);
CREATE POLICY "companies_read" ON public.companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "prices_read" ON public.company_prices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "orders_self" ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "order_items_self" ON public.order_items FOR ALL
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
CREATE POLICY "settings_read" ON public.settings FOR SELECT USING (auth.uid() IS NOT NULL);
