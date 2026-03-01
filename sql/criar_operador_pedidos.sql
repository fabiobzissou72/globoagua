-- Atualiza role/perfil do operador de pedidos.
-- IMPORTANTE: nao cria usuario no auth.* por SQL.
-- 1) Crie/redefina o usuario em Supabase Auth > Users (email/senha).
-- 2) Rode este script para vincular role no profiles.

DO $$
DECLARE
  v_uid uuid;
  v_email text := 'globoagua@globoagua.com.br';
BEGIN
  -- Compatibilidade: cria coluna role se ainda nao existir
  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role text;

  UPDATE public.profiles
     SET role = CASE
       WHEN coalesce(is_admin, false) THEN 'admin'
       ELSE 'cliente'
     END
   WHERE role IS NULL;

  ALTER TABLE public.profiles
    ALTER COLUMN role SET DEFAULT 'cliente';

  SELECT id INTO v_uid
    FROM auth.users
   WHERE email = v_email
     AND deleted_at IS NULL
   LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario % nao encontrado em auth.users. Crie-o no painel Auth e rode novamente.', v_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM auth.identities i
     WHERE i.user_id = v_uid
       AND i.provider = 'email'
  ) THEN
    RAISE EXCEPTION 'Usuario % existe, mas sem auth.identities (email). Recrie no Auth > Users.', v_email;
  END IF;

  INSERT INTO public.profiles (id, nome_completo, whatsapp, is_admin, role)
  VALUES (v_uid, 'Operador Pedidos', '11985758066', false, 'operador_pedidos')
  ON CONFLICT (id) DO UPDATE
    SET nome_completo = EXCLUDED.nome_completo,
        whatsapp = EXCLUDED.whatsapp,
        is_admin = false,
        role = 'operador_pedidos';

  RAISE NOTICE 'Perfil de operador atualizado para % (uid=%).', v_email, v_uid;
END;
$$;
