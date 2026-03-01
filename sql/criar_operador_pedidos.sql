-- Cria/atualiza usuario operador de pedidos
-- Execute no Supabase SQL Editor apos rodar rbac_operador_pedidos.sql

DO $$
DECLARE
  v_uid uuid;
  v_email text := 'globoagua@globoagua.com.br';
  v_old_email text := '11985758066@operador.local';
  v_password text := 'GA2026';
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
  WHERE email = v_email;

  -- Se ja existir usuario antigo, migra para o novo email
  IF v_uid IS NULL THEN
    SELECT id INTO v_uid
    FROM auth.users
    WHERE email = v_old_email;
  END IF;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome_completo":"Operador Pedidos","whatsapp":"11985758066"}',
      false,
      ''
    );
  ELSE
    UPDATE auth.users
       SET email = v_email,
           email_change = '',
           email_change_token_new = '',
           email_change_token_current = '',
           encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now(),
           raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{whatsapp}', '"11985758066"'::jsonb, true)
     WHERE id = v_uid;
  END IF;

  INSERT INTO public.profiles (id, nome_completo, whatsapp, is_admin, role)
  VALUES (v_uid, 'Operador Pedidos', '11985758066', false, 'operador_pedidos')
  ON CONFLICT (id) DO UPDATE
    SET nome_completo = EXCLUDED.nome_completo,
        whatsapp = EXCLUDED.whatsapp,
        is_admin = false,
        role = 'operador_pedidos';

  RAISE NOTICE 'Operador criado/atualizado. Login: %, senha: %', v_email, v_password;
END;
$$;
