/**
 * Servicio de Gestión de Workflows
 * Maneja toda la lógica de flujos de trabajo automatizados
 */

import { supabase } from '@/integrations/supabase/client';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai' | 'integration' | 'output';
  name: string;
  description: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  status: 'idle' | 'running' | 'success' | 'error';
  connections: string[];
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type?: string;
  trigger_config: Record<string, any>;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    nodeId?: string;
  }>;
  error_message?: string;
  duration_ms?: number;
  nodes_executed: number;
  started_at: string;
  completed_at?: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  trigger_type?: string;
  trigger_config?: Record<string, any>;
  tags?: string[];
}

export interface UpdateWorkflowInput extends Partial<CreateWorkflowInput> {
  status?: Workflow['status'];
}

class WorkflowService {
  /**
   * Obtener todos los workflows del usuario
   */
  async getWorkflows(userId: string): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
      throw new Error('Error al obtener workflows');
    }

    return data as Workflow[];
  }

  /**
   * Obtener un workflow específico
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching workflow:', error);
      throw new Error('Error al obtener workflow');
    }

    return data as Workflow;
  }

  /**
   * Crear un nuevo workflow
   */
  async createWorkflow(userId: string, input: CreateWorkflowInput): Promise<Workflow> {
    const workflowData = {
      user_id: userId,
      name: input.name,
      description: input.description,
      nodes: input.nodes || [],
      connections: input.connections || [],
      status: 'draft' as const,
      trigger_type: input.trigger_type,
      trigger_config: input.trigger_config || {},
      tags: input.tags || [],
      version: 1,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      throw new Error('Error al crear workflow');
    }

    return data as Workflow;
  }

  /**
   * Actualizar un workflow
   */
  async updateWorkflow(workflowId: string, input: UpdateWorkflowInput): Promise<Workflow> {
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.nodes !== undefined) updateData.nodes = input.nodes;
    if (input.connections !== undefined) updateData.connections = input.connections;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.trigger_type !== undefined) updateData.trigger_type = input.trigger_type;
    if (input.trigger_config !== undefined) updateData.trigger_config = input.trigger_config;
    if (input.tags !== undefined) updateData.tags = input.tags;

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow:', error);
      throw new Error('Error al actualizar workflow');
    }

    return data as Workflow;
  }

  /**
   * Eliminar un workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      console.error('Error deleting workflow:', error);
      throw new Error('Error al eliminar workflow');
    }
  }

  /**
   * Activar un workflow
   */
  async activateWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'active' });
  }

  /**
   * Pausar un workflow
   */
  async pauseWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'paused' });
  }

  /**
   * Ejecutar un workflow manualmente
   */
  async executeWorkflow(
    workflowId: string,
    inputData: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error('Workflow no encontrado');
    }

    // Crear registro de ejecución
    const executionData = {
      workflow_id: workflowId,
      status: 'running' as const,
      input_data: inputData,
      output_data: {},
      logs: [],
      nodes_executed: 0,
      started_at: new Date().toISOString()
    };

    const { data: execution, error } = await supabase
      .from('workflow_executions')
      .insert(executionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow execution:', error);
      throw new Error('Error al crear ejecución de workflow');
    }

    // Ejecutar workflow en segundo plano
    this.runWorkflow(execution.id, workflow, inputData).catch(err => {
      console.error('Error running workflow:', err);
    });

    return execution as WorkflowExecution;
  }

  /**
   * Ejecutar workflow (lógica interna)
   */
  private async runWorkflow(
    executionId: string,
    workflow: Workflow,
    inputData: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now();
    const logs: WorkflowExecution['logs'] = [];
    let nodesExecuted = 0;
    let outputData: Record<string, any> = {};

    try {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Iniciando ejecución del workflow: ${workflow.name}`
      });

      // Encontrar nodo trigger (primer nodo)
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      
      if (!triggerNode) {
        throw new Error('No se encontró nodo trigger');
      }

      // Ejecutar nodos en secuencia
      let currentNodeId = triggerNode.id;
      const executedNodes = new Set<string>();
      const nodeOutputs: Record<string, any> = { [triggerNode.id]: inputData };

      while (currentNodeId) {
        if (executedNodes.has(currentNodeId)) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'warning',
            message: `Ciclo detectado en nodo: ${currentNodeId}`,
            nodeId: currentNodeId
          });
          break;
        }

        const node = workflow.nodes.find(n => n.id === currentNodeId);
        
        if (!node) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Nodo no encontrado: ${currentNodeId}`,
            nodeId: currentNodeId
          });
          break;
        }

        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Ejecutando nodo: ${node.name}`,
          nodeId: node.id
        });

        try {
          // Ejecutar nodo
          const nodeInput = nodeOutputs[currentNodeId] || {};
          const nodeOutput = await this.executeNode(node, nodeInput);
          
          nodeOutputs[node.id] = nodeOutput;
          executedNodes.add(currentNodeId);
          nodesExecuted++;

          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Nodo completado: ${node.name}`,
            nodeId: node.id
          });

          // Encontrar siguiente nodo
          const connection = workflow.connections.find(c => c.source === currentNodeId);
          
          if (connection) {
            currentNodeId = connection.target;
            nodeOutputs[currentNodeId] = nodeOutput;
          } else {
            // No hay más nodos, terminar
            outputData = nodeOutput;
            currentNodeId = '';
          }
        } catch (nodeError: any) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Error en nodo ${node.name}: ${nodeError.message}`,
            nodeId: node.id
          });
          throw nodeError;
        }
      }

      // Ejecución exitosa
      const duration = Date.now() - startTime;

      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          output_data: outputData,
          logs: logs,
          nodes_executed: nodesExecuted,
          duration_ms: duration,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      // Actualizar estadísticas del workflow
      await supabase
        .from('workflows')
        .update({
          total_executions: workflow.total_executions + 1,
          successful_executions: workflow.successful_executions + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Workflow completado exitosamente en ${duration}ms`
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;

      logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Error en ejecución: ${error.message}`
      });

      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          error_message: error.message,
          logs: logs,
          nodes_executed: nodesExecuted,
          duration_ms: duration,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      // Actualizar estadísticas del workflow
      await supabase
        .from('workflows')
        .update({
          total_executions: workflow.total_executions + 1,
          failed_executions: workflow.failed_executions + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflow.id);
    }
  }

  /**
   * Ejecutar un nodo individual
   */
  private async executeNode(
    node: WorkflowNode,
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    // Simulación de ejecución de nodo
    // En producción, aquí iría la lógica real de cada tipo de nodo
    
    switch (node.type) {
      case 'trigger':
        return input;
      
      case 'action':
        // Ejecutar acción (enviar email, SMS, etc.)
        return { ...input, actionExecuted: true };
      
      case 'condition':
        // Evaluar condición
        return { ...input, conditionMet: true };
      
      case 'ai':
        // Llamar a servicio de IA
        return { ...input, aiProcessed: true };
      
      case 'integration':
        // Llamar a integración externa
        return { ...input, integrationCalled: true };
      
      case 'output':
        // Formatear salida
        return input;
      
      default:
        return input;
    }
  }

  /**
   * Obtener ejecuciones de un workflow
   */
  async getWorkflowExecutions(
    workflowId: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching workflow executions:', error);
      throw new Error('Error al obtener ejecuciones');
    }

    return data as WorkflowExecution[];
  }

  /**
   * Obtener una ejecución específica
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching execution:', error);
      throw new Error('Error al obtener ejecución');
    }

    return data as WorkflowExecution;
  }

  /**
   * Cancelar una ejecución en curso
   */
  async cancelExecution(executionId: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) {
      console.error('Error cancelling execution:', error);
      throw new Error('Error al cancelar ejecución');
    }
  }

  /**
   * Duplicar workflow
   */
  async duplicateWorkflow(workflowId: string, userId: string): Promise<Workflow> {
    const original = await this.getWorkflow(workflowId);
    
    if (!original) {
      throw new Error('Workflow no encontrado');
    }

    return this.createWorkflow(userId, {
      name: `${original.name} (Copia)`,
      description: original.description,
      nodes: original.nodes,
      connections: original.connections,
      trigger_type: original.trigger_type,
      trigger_config: original.trigger_config,
      tags: original.tags
    });
  }

  /**
   * Obtener estadísticas de workflow
   */
  async getWorkflowStats(workflowId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    avgDuration: number;
  }> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error('Workflow no encontrado');
    }

    // Calcular duración promedio
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('duration_ms')
      .eq('workflow_id', workflowId)
      .not('duration_ms', 'is', null);

    const avgDuration = executions && executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / executions.length
      : 0;

    const successRate = workflow.total_executions > 0
      ? (workflow.successful_executions / workflow.total_executions) * 100
      : 0;

    return {
      totalExecutions: workflow.total_executions,
      successfulExecutions: workflow.successful_executions,
      failedExecutions: workflow.failed_executions,
      successRate: Math.round(successRate * 100) / 100,
      avgDuration: Math.round(avgDuration)
    };
  }
}

export const workflowService = new WorkflowService();

