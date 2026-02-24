-- Cria o usuario admin diretamente no banco
-- Execute no Supabase SQL Editor

DO $$
DECLARE
  v_uid uuid;
BEGIN
  -- Verifica se usuario ja existe
  SELECT id INTO v_uid FROM auth.users WHERE email = 'fabiobz@gmail.com';

  -- Se nao existe, cria
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid, 'authenticated', 'authenticated',
      'fabiobz@gmail.com',
      crypt('Fbz12061972@@@#', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome_completo":"Fabio Admin"}',
      false, ''
    );
  END IF;

  -- Garante que tem perfil
  INSERT INTO public.profiles (id, nome_completo, is_admin)
  VALUES (v_uid, 'Fabio Admin', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  RAISE NOTICE 'Admin criado/atualizado com sucesso! ID: %', v_uid;
END;
$$;
