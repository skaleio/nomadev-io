-- Cada import debe poder convivir con sus propias filas, incluso si dos
-- subidas comparten el mismo dropi_numeric_id. Cambiamos la clave única
-- de (user_id, dropi_numeric_id) a (user_id, import_id, dropi_numeric_id)
-- para que el historial muestre cada subida con su set completo.

ALTER TABLE public.dropi_orders
  DROP CONSTRAINT IF EXISTS dropi_orders_user_dropi_unique;

DELETE FROM public.dropi_orders WHERE import_id IS NULL;

ALTER TABLE public.dropi_orders
  ALTER COLUMN import_id SET NOT NULL;

ALTER TABLE public.dropi_orders
  ADD CONSTRAINT dropi_orders_user_import_dropi_unique
  UNIQUE (user_id, import_id, dropi_numeric_id);

CREATE INDEX IF NOT EXISTS idx_dropi_orders_import
  ON public.dropi_orders (import_id);
