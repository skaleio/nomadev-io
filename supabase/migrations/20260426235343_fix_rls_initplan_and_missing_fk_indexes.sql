-- Fix 1: FK indexes faltantes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to        ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_conversation_id    ON public.leads (conversation_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id  ON public.lead_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_user_id ON public.ai_training_data (user_id);
CREATE INDEX IF NOT EXISTS idx_dropi_orders_import_id   ON public.dropi_orders (import_id);

-- Fix 2: shopify_webhooks — eliminar SELECT redundante, recrear ALL con (SELECT auth.uid())
DROP POLICY IF EXISTS "Users can view webhooks for their connections" ON public.shopify_webhooks;
DROP POLICY IF EXISTS "System can manage webhooks" ON public.shopify_webhooks;
CREATE POLICY "System can manage webhooks" ON public.shopify_webhooks FOR ALL
  USING  (EXISTS (SELECT 1 FROM public.shopify_connections sc WHERE sc.id = shopify_webhooks.connection_id AND sc.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shopify_connections sc WHERE sc.id = shopify_webhooks.connection_id AND sc.user_id = (SELECT auth.uid())));

-- Fix 3: auth_rls_initplan — (SELECT auth.uid()) en todas las políticas

-- AGENTS
DROP POLICY IF EXISTS "Users can view their own agents"   ON public.agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.agents;
CREATE POLICY "Users can view their own agents"   ON public.agents FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their own agents" ON public.agents FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own agents" ON public.agents FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own agents" ON public.agents FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their own conversations"   ON public.conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"   ON public.conversations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages from their conversations" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can create messages in their conversations" ON public.messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can update messages in their conversations" ON public.messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid())));

-- WORKFLOWS
DROP POLICY IF EXISTS "Users can view their own workflows"   ON public.workflows;
DROP POLICY IF EXISTS "Users can create their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON public.workflows;
CREATE POLICY "Users can view their own workflows"   ON public.workflows FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their own workflows" ON public.workflows FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own workflows" ON public.workflows FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- WORKFLOW_EXECUTIONS
DROP POLICY IF EXISTS "Users can view their workflow executions"                 ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can insert workflow executions for their workflows" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can update their workflow executions"               ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can delete their workflow executions"               ON public.workflow_executions;
CREATE POLICY "Users can view their workflow executions" ON public.workflow_executions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can insert workflow executions for their workflows" ON public.workflow_executions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can update their workflow executions" ON public.workflow_executions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can delete their workflow executions" ON public.workflow_executions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = (SELECT auth.uid())));

-- LEADS
DROP POLICY IF EXISTS "Users can view their own leads"   ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"   ON public.leads FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their own leads" ON public.leads FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- LEAD_ACTIVITIES
DROP POLICY IF EXISTS "Users can view their lead activities"             ON public.lead_activities;
DROP POLICY IF EXISTS "Users can create lead activities for their leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can update their lead activities"           ON public.lead_activities;
DROP POLICY IF EXISTS "Users can delete their lead activities"           ON public.lead_activities;
CREATE POLICY "Users can view their lead activities" ON public.lead_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activities.lead_id AND l.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can create lead activities for their leads" ON public.lead_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activities.lead_id AND l.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can update their lead activities" ON public.lead_activities FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activities.lead_id AND l.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can delete their lead activities" ON public.lead_activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activities.lead_id AND l.user_id = (SELECT auth.uid())));

-- AI_TRAINING_DATA
DROP POLICY IF EXISTS "Users can view their ai_training_data"   ON public.ai_training_data;
DROP POLICY IF EXISTS "Users can create their ai_training_data" ON public.ai_training_data;
DROP POLICY IF EXISTS "Users can update their ai_training_data" ON public.ai_training_data;
DROP POLICY IF EXISTS "Users can delete their ai_training_data" ON public.ai_training_data;
CREATE POLICY "Users can view their ai_training_data"   ON public.ai_training_data FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their ai_training_data" ON public.ai_training_data FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their ai_training_data" ON public.ai_training_data FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their ai_training_data" ON public.ai_training_data FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ANALYTICS_EVENTS
DROP POLICY IF EXISTS "Users can view their analytics_events"   ON public.analytics_events;
DROP POLICY IF EXISTS "Users can create their analytics_events" ON public.analytics_events;
CREATE POLICY "Users can view their analytics_events"   ON public.analytics_events FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their analytics_events" ON public.analytics_events FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- INTEGRATIONS
DROP POLICY IF EXISTS "Users can view their own integrations"   ON public.integrations;
DROP POLICY IF EXISTS "Users can create their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.integrations;
CREATE POLICY "Users can view their own integrations"   ON public.integrations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create their own integrations" ON public.integrations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own integrations" ON public.integrations FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own integrations" ON public.integrations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- USER_EXTERNAL_CONFIGS
DROP POLICY IF EXISTS "user_external_configs_select_own" ON public.user_external_configs;
DROP POLICY IF EXISTS "user_external_configs_insert_own" ON public.user_external_configs;
DROP POLICY IF EXISTS "user_external_configs_update_own" ON public.user_external_configs;
DROP POLICY IF EXISTS "user_external_configs_delete_own" ON public.user_external_configs;
CREATE POLICY "user_external_configs_select_own" ON public.user_external_configs FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_external_configs_insert_own" ON public.user_external_configs FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_external_configs_update_own" ON public.user_external_configs FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_external_configs_delete_own" ON public.user_external_configs FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- SHOPIFY_CONNECTIONS
DROP POLICY IF EXISTS "Users can view their own Shopify connections"   ON public.shopify_connections;
DROP POLICY IF EXISTS "Users can insert their own Shopify connections" ON public.shopify_connections;
DROP POLICY IF EXISTS "Users can update their own Shopify connections" ON public.shopify_connections;
DROP POLICY IF EXISTS "Users can delete their own Shopify connections" ON public.shopify_connections;
CREATE POLICY "Users can view their own Shopify connections"   ON public.shopify_connections FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own Shopify connections" ON public.shopify_connections FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own Shopify connections" ON public.shopify_connections FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own Shopify connections" ON public.shopify_connections FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- SHOPIFY_OAUTH_STATES
DROP POLICY IF EXISTS "Users can view their own OAuth states"   ON public.shopify_oauth_states;
DROP POLICY IF EXISTS "Users can insert their own OAuth states" ON public.shopify_oauth_states;
DROP POLICY IF EXISTS "Users can update their own OAuth states" ON public.shopify_oauth_states;
CREATE POLICY "Users can view their own OAuth states"   ON public.shopify_oauth_states FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own OAuth states" ON public.shopify_oauth_states FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own OAuth states" ON public.shopify_oauth_states FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- SHOPIFY_ACTIVITY_LOG
DROP POLICY IF EXISTS "Users can view their own activity log" ON public.shopify_activity_log;
DROP POLICY IF EXISTS "System can insert activity logs"       ON public.shopify_activity_log;
CREATE POLICY "Users can view their own activity log" ON public.shopify_activity_log FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "System can insert activity logs"       ON public.shopify_activity_log FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- DROPI_ORDERS
DROP POLICY IF EXISTS "dropi_orders_select_own" ON public.dropi_orders;
DROP POLICY IF EXISTS "dropi_orders_insert_own" ON public.dropi_orders;
DROP POLICY IF EXISTS "dropi_orders_update_own" ON public.dropi_orders;
DROP POLICY IF EXISTS "dropi_orders_delete_own" ON public.dropi_orders;
CREATE POLICY "dropi_orders_select_own" ON public.dropi_orders FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_orders_insert_own" ON public.dropi_orders FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_orders_update_own" ON public.dropi_orders FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_orders_delete_own" ON public.dropi_orders FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- DROPI_ORDER_IMPORTS
DROP POLICY IF EXISTS "dropi_order_imports_select_own" ON public.dropi_order_imports;
DROP POLICY IF EXISTS "dropi_order_imports_insert_own" ON public.dropi_order_imports;
DROP POLICY IF EXISTS "dropi_order_imports_delete_own" ON public.dropi_order_imports;
CREATE POLICY "dropi_order_imports_select_own" ON public.dropi_order_imports FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_order_imports_insert_own" ON public.dropi_order_imports FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_order_imports_delete_own" ON public.dropi_order_imports FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- DROPI_META_SPEND_SNAPSHOTS
DROP POLICY IF EXISTS "dropi_meta_spend_select_own" ON public.dropi_meta_spend_snapshots;
DROP POLICY IF EXISTS "dropi_meta_spend_insert_own" ON public.dropi_meta_spend_snapshots;
DROP POLICY IF EXISTS "dropi_meta_spend_update_own" ON public.dropi_meta_spend_snapshots;
DROP POLICY IF EXISTS "dropi_meta_spend_delete_own" ON public.dropi_meta_spend_snapshots;
CREATE POLICY "dropi_meta_spend_select_own" ON public.dropi_meta_spend_snapshots FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_meta_spend_insert_own" ON public.dropi_meta_spend_snapshots FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_meta_spend_update_own" ON public.dropi_meta_spend_snapshots FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "dropi_meta_spend_delete_own" ON public.dropi_meta_spend_snapshots FOR DELETE USING ((SELECT auth.uid()) = user_id);
