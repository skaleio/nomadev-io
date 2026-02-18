-- ============================================
-- NOMADEV: Políticas RLS faltantes y policy DELETE para conversations
-- ============================================

-- workflow_executions: acceso por ownership del workflow
CREATE POLICY "Users can view their workflow executions" ON workflow_executions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = auth.uid())
  );
CREATE POLICY "Users can insert workflow executions for their workflows" ON workflow_executions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = auth.uid())
  );
CREATE POLICY "Users can update their workflow executions" ON workflow_executions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = auth.uid())
  );
CREATE POLICY "Users can delete their workflow executions" ON workflow_executions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = auth.uid())
  );

-- lead_activities: acceso por ownership del lead
CREATE POLICY "Users can view their lead activities" ON lead_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_activities.lead_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users can create lead activities for their leads" ON lead_activities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_activities.lead_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users can update their lead activities" ON lead_activities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_activities.lead_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users can delete their lead activities" ON lead_activities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_activities.lead_id AND l.user_id = auth.uid())
  );

-- ai_training_data: por user_id
CREATE POLICY "Users can view their ai_training_data" ON ai_training_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their ai_training_data" ON ai_training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their ai_training_data" ON ai_training_data
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their ai_training_data" ON ai_training_data
  FOR DELETE USING (auth.uid() = user_id);

-- analytics_events: por user_id
CREATE POLICY "Users can view their analytics_events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their analytics_events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- conversations: policy DELETE
CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- messages: policy UPDATE
CREATE POLICY "Users can update messages in their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
  );
