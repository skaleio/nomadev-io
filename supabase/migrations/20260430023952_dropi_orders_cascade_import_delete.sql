-- import_id ahora es NOT NULL; el FK debe cascadear al borrar el import
-- (no SET NULL, porque colisiona con NOT NULL y porque borrar una entrada
-- del historial debe arrastrar sus filas).

ALTER TABLE public.dropi_orders
  DROP CONSTRAINT IF EXISTS dropi_orders_import_id_fkey;

ALTER TABLE public.dropi_orders
  ADD CONSTRAINT dropi_orders_import_id_fkey
  FOREIGN KEY (import_id) REFERENCES public.dropi_order_imports(id) ON DELETE CASCADE;
