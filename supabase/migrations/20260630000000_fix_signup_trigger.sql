-- ============================================================
-- Correção do cadastro: "Database error saving new user"
-- Causa: handle_new_user() faz INSERT ... ON CONFLICT (user_id)
-- na tabela clients, mas não existia constraint UNIQUE em
-- clients.user_id, o que invalidava o ON CONFLICT (erro 42P10)
-- e derrubava todo o trigger de criação de usuário.
-- ============================================================

-- 1) Garante unicidade de user_id em clients (necessário para o ON CONFLICT).
--    Constraint UNIQUE completa: no Postgres, valores NULL são considerados
--    distintos entre si (NULLS DISTINCT), então múltiplos clients sem
--    user_id continuam permitidos. Um índice parcial NÃO serve aqui porque
--    o ON CONFLICT (user_id) do trigger não casa com predicado parcial.
DROP INDEX IF EXISTS public.clients_user_id_key;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_unique;
ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);

-- 2) Recria o trigger de forma resiliente: profiles + user_roles são
--    essenciais; clients e notifications são "best-effort" e nunca
--    devem impedir a criação da conta caso algo falhe.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
BEGIN
  -- Perfil (essencial)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, v_name)
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);

  -- Papel padrão (essencial)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT DO NOTHING;

  -- Cliente no CRM (best-effort: não bloqueia o cadastro)
  BEGIN
    INSERT INTO public.clients (user_id, full_name, email, status)
    VALUES (new.id, v_name, new.email, 'ativo')
    ON CONFLICT (user_id) DO UPDATE
      SET email = excluded.email,
          full_name = coalesce(nullif(excluded.full_name, ''), public.clients.full_name);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: falha ao criar client para %: %', new.id, SQLERRM;
  END;

  -- Notificação para o painel admin (best-effort)
  BEGIN
    INSERT INTO public.notifications (title, description, type)
    VALUES ('Novo cliente', coalesce(nullif(v_name, ''), new.email) || ' criou uma conta', 'cliente');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: falha ao criar notificação para %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$function$;
