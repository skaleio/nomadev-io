-- Limpieza de tablas antiguas antes de aplicar el nuevo esquema
-- Este archivo se ejecutará ANTES de la migración principal

-- Desactivar temporalmente las políticas de seguridad
SET session_replication_role = 'replica';

-- Eliminar TODAS las tablas nuevas primero (por si ya se intentó crearlas)
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS ai_training_data CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- Eliminar tablas antiguas en orden
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;
DROP TABLE IF EXISTS api_usage_logs CASCADE;
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS circuit_breakers CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS message_queue CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS processing_batches CASCADE;
DROP TABLE IF EXISTS rate_limit_blocks CASCADE;
DROP TABLE IF EXISTS rate_limit_buckets CASCADE;
DROP TABLE IF EXISTS rate_limit_logs CASCADE;
DROP TABLE IF EXISTS rate_limit_windows CASCADE;
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS security_api_keys CASCADE;
DROP TABLE IF EXISTS security_audit_log CASCADE;
DROP TABLE IF EXISTS security_blocks CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS service_health_checks CASCADE;
DROP TABLE IF EXISTS user_mfa_secrets CASCADE;
DROP TABLE IF EXISTS user_mfa_sessions CASCADE;
DROP TABLE IF EXISTS shopify_oauth_states CASCADE;
DROP TABLE IF EXISTS shopify_metrics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_env_configs CASCADE;
DROP TABLE IF EXISTS user_infrastructure CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS agents_with_stats CASCADE;
DROP VIEW IF EXISTS conversations_with_last_message CASCADE;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_agent_metrics() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

-- Reactivar políticas de seguridad
SET session_replication_role = 'origin';

