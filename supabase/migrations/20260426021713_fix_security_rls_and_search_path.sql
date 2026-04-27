-- Fix 1: shopify_activity_log INSERT policy (WITH CHECK true → user_id check)
DROP POLICY IF EXISTS "System can insert activity logs" ON public.shopify_activity_log;
CREATE POLICY "System can insert activity logs"
  ON public.shopify_activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: shopify_webhooks ALL policy (USING true / WITH CHECK true → connection-scoped)
DROP POLICY IF EXISTS "System can manage webhooks" ON public.shopify_webhooks;
CREATE POLICY "System can manage webhooks"
  ON public.shopify_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shopify_connections sc
      WHERE sc.id = shopify_webhooks.connection_id
        AND sc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopify_connections sc
      WHERE sc.id = shopify_webhooks.connection_id
        AND sc.user_id = auth.uid()
    )
  );

-- Fix 3: Eliminar políticas duplicadas en user_external_configs
DROP POLICY IF EXISTS "Users can delete own external configs"  ON public.user_external_configs;
DROP POLICY IF EXISTS "Users can insert own external configs"  ON public.user_external_configs;
DROP POLICY IF EXISTS "Users can view own external configs"    ON public.user_external_configs;
DROP POLICY IF EXISTS "Users can update own external configs"  ON public.user_external_configs;

-- Fix 4: search_path en todas las funciones públicas
ALTER FUNCTION public.update_updated_at_column()            SET search_path = public, pg_temp;
ALTER FUNCTION public.update_agent_metrics()                SET search_path = public, pg_temp;
ALTER FUNCTION public.update_conversation_last_message()    SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_api_logs()                SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_expired_windows()             SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_security_logs()               SET search_path = public, pg_temp;
ALTER FUNCTION public.detect_suspicious_activity()          SET search_path = public, pg_temp;
ALTER FUNCTION public.audit_trigger_function()              SET search_path = public, pg_temp;
ALTER FUNCTION public.set_dropi_orders_updated_at()         SET search_path = public, pg_temp;
ALTER FUNCTION public.set_user_external_configs_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_next_message_from_queue(uuid)     SET search_path = public, pg_temp;
ALTER FUNCTION public.get_batch_from_queue(uuid, integer)   SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_message_sent(uuid, character varying) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_message_failed(uuid, text)       SET search_path = public, pg_temp;
ALTER FUNCTION public.log_shopify_activity(uuid, uuid, text, jsonb, boolean, text) SET search_path = public, pg_temp;
