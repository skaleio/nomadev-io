-- Revocar EXECUTE de anon/authenticated en funciones SECURITY DEFINER internas
-- que NO deben ser invocables vía /rest/v1/rpc/

REVOKE EXECUTE ON FUNCTION public.audit_trigger_function()      FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_windows()     FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_api_logs()        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_security_logs()       FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.detect_suspicious_activity()  FROM anon, authenticated, public;