-- NOMADEV: Vistas con SECURITY INVOKER para respetar RLS del usuario
ALTER VIEW agents_with_stats SET (security_invoker = on);
ALTER VIEW conversations_with_last_message SET (security_invoker = on);
