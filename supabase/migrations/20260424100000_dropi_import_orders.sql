-- Importación de guías Dropi (XLSX) y gasto Meta para métricas de rentabilidad

CREATE TABLE IF NOT EXISTS public.dropi_order_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  source_filename TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dropi_order_imports_user_created
  ON public.dropi_order_imports (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.dropi_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  import_id UUID REFERENCES public.dropi_order_imports (id) ON DELETE SET NULL,
  dropi_numeric_id BIGINT NOT NULL,
  report_date DATE,
  order_date DATE NOT NULL,
  order_time TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  status_raw TEXT NOT NULL,
  status_bucket TEXT NOT NULL,
  department TEXT,
  city TEXT,
  address TEXT,
  notes TEXT,
  carrier TEXT,
  guide_number TEXT,
  invoice_number TEXT,
  invoiced_amount NUMERIC(14, 2),
  product_sale_amount NUMERIC(14, 2),
  profit NUMERIC(14, 2),
  shipping_price NUMERIC(14, 2),
  return_shipping_cost NUMERIC(14, 2),
  commission NUMERIC(14, 2),
  supplier_total NUMERIC(14, 2),
  categories TEXT,
  store_name TEXT,
  store_order_id TEXT,
  shop_order_number TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dropi_orders_user_dropi_unique UNIQUE (user_id, dropi_numeric_id),
  CONSTRAINT dropi_orders_status_bucket_check CHECK (
    status_bucket IN (
      'cancelled',
      'delivered',
      'return_flow',
      'issue',
      'in_transit',
      'pending'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_dropi_orders_user_order_date
  ON public.dropi_orders (user_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_dropi_orders_user_status
  ON public.dropi_orders (user_id, status_bucket);

CREATE TABLE IF NOT EXISTS public.dropi_meta_spend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  meta_ad_spend NUMERIC(14, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dropi_meta_spend_range_check CHECK (period_end >= period_start),
  CONSTRAINT dropi_meta_spend_user_period_unique UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_dropi_meta_spend_user
  ON public.dropi_meta_spend_snapshots (user_id, period_start, period_end);

CREATE OR REPLACE FUNCTION public.set_dropi_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dropi_orders_updated_at ON public.dropi_orders;
CREATE TRIGGER trg_dropi_orders_updated_at
  BEFORE UPDATE ON public.dropi_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_dropi_orders_updated_at();

ALTER TABLE public.dropi_order_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropi_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropi_meta_spend_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dropi_order_imports_select_own" ON public.dropi_order_imports;
DROP POLICY IF EXISTS "dropi_order_imports_insert_own" ON public.dropi_order_imports;
DROP POLICY IF EXISTS "dropi_order_imports_delete_own" ON public.dropi_order_imports;

CREATE POLICY "dropi_order_imports_select_own"
  ON public.dropi_order_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dropi_order_imports_insert_own"
  ON public.dropi_order_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dropi_order_imports_delete_own"
  ON public.dropi_order_imports FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dropi_orders_select_own" ON public.dropi_orders;
DROP POLICY IF EXISTS "dropi_orders_insert_own" ON public.dropi_orders;
DROP POLICY IF EXISTS "dropi_orders_update_own" ON public.dropi_orders;
DROP POLICY IF EXISTS "dropi_orders_delete_own" ON public.dropi_orders;

CREATE POLICY "dropi_orders_select_own"
  ON public.dropi_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dropi_orders_insert_own"
  ON public.dropi_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dropi_orders_update_own"
  ON public.dropi_orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dropi_orders_delete_own"
  ON public.dropi_orders FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dropi_meta_spend_select_own" ON public.dropi_meta_spend_snapshots;
DROP POLICY IF EXISTS "dropi_meta_spend_insert_own" ON public.dropi_meta_spend_snapshots;
DROP POLICY IF EXISTS "dropi_meta_spend_update_own" ON public.dropi_meta_spend_snapshots;
DROP POLICY IF EXISTS "dropi_meta_spend_delete_own" ON public.dropi_meta_spend_snapshots;

CREATE POLICY "dropi_meta_spend_select_own"
  ON public.dropi_meta_spend_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dropi_meta_spend_insert_own"
  ON public.dropi_meta_spend_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dropi_meta_spend_update_own"
  ON public.dropi_meta_spend_snapshots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dropi_meta_spend_delete_own"
  ON public.dropi_meta_spend_snapshots FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.dropi_orders IS 'Pedidos importados desde exportación XLSX de Dropi (guías). Métricas se calculan en app a partir de status_bucket y montos.';
COMMENT ON COLUMN public.dropi_orders.status_bucket IS 'cancelled|delivered|return_flow|issue|in_transit|pending — derivado de ESTATUS para KPIs.';
COMMENT ON COLUMN public.dropi_orders.product_sale_amount IS 'VALOR DE COMPRA EN PRODUCTOS (venta al cliente / cobro típico COD).';
COMMENT ON COLUMN public.dropi_orders.profit IS 'GANANCIA según Dropi; ganancia real usa solo delivered.';
