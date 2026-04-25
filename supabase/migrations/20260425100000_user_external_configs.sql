-- Tabla de configuraciones externas por usuario (tokens Dropi, futuros servicios)
-- Existía sólo en old_migrations; esta migración la hace parte del esquema oficial.

CREATE TABLE IF NOT EXISTS public.user_external_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_external_configs_user_service_unique UNIQUE (user_id, service_name)
);

CREATE INDEX IF NOT EXISTS idx_user_external_configs_user_id
  ON public.user_external_configs (user_id);

CREATE INDEX IF NOT EXISTS idx_user_external_configs_service
  ON public.user_external_configs (user_id, service_name);

CREATE OR REPLACE FUNCTION public.set_user_external_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_external_configs_updated_at ON public.user_external_configs;
CREATE TRIGGER trg_user_external_configs_updated_at
  BEFORE UPDATE ON public.user_external_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_user_external_configs_updated_at();

ALTER TABLE public.user_external_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_external_configs_select_own" ON public.user_external_configs;
DROP POLICY IF EXISTS "user_external_configs_insert_own" ON public.user_external_configs;
DROP POLICY IF EXISTS "user_external_configs_update_own" ON public.user_external_configs;
DROP POLICY IF EXISTS "user_external_configs_delete_own" ON public.user_external_configs;

CREATE POLICY "user_external_configs_select_own"
  ON public.user_external_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_external_configs_insert_own"
  ON public.user_external_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_external_configs_update_own"
  ON public.user_external_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_external_configs_delete_own"
  ON public.user_external_configs FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_external_configs IS 'Credenciales de servicios externos por usuario (Dropi token, etc.). config_data almacena el payload JSON del servicio.';
COMMENT ON COLUMN public.user_external_configs.service_name IS 'Identificador del servicio: ''dropi'', ''shopify'', etc.';