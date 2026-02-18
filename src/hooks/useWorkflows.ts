/**
 * Hook para gestión de workflows
 */

import { useState, useEffect } from 'react';
import { 
  workflowService, 
  Workflow, 
  WorkflowExecution,
  CreateWorkflowInput, 
  UpdateWorkflowInput 
} from '@/lib/services/workflow-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useWorkflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar workflows
  const loadWorkflows = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await workflowService.getWorkflows(user.id);
      setWorkflows(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar workflows');
    } finally {
      setLoading(false);
    }
  };

  // Crear workflow
  const createWorkflow = async (input: CreateWorkflowInput): Promise<Workflow | null> => {
    if (!user) return null;

    try {
      const newWorkflow = await workflowService.createWorkflow(user.id, input);
      setWorkflows(prev => [newWorkflow, ...prev]);
      toast.success('Workflow creado exitosamente');
      return newWorkflow;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Actualizar workflow
  const updateWorkflow = async (
    workflowId: string,
    input: UpdateWorkflowInput
  ): Promise<Workflow | null> => {
    try {
      const updated = await workflowService.updateWorkflow(workflowId, input);
      setWorkflows(prev => prev.map(w => w.id === workflowId ? updated : w));
      toast.success('Workflow actualizado');
      return updated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Eliminar workflow
  const deleteWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      await workflowService.deleteWorkflow(workflowId);
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      toast.success('Workflow eliminado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Activar workflow
  const activateWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      const updated = await workflowService.activateWorkflow(workflowId);
      setWorkflows(prev => prev.map(w => w.id === workflowId ? updated : w));
      toast.success('Workflow activado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Pausar workflow
  const pauseWorkflow = async (workflowId: string): Promise<boolean> => {
    try {
      const updated = await workflowService.pauseWorkflow(workflowId);
      setWorkflows(prev => prev.map(w => w.id === workflowId ? updated : w));
      toast.success('Workflow pausado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Ejecutar workflow
  const executeWorkflow = async (
    workflowId: string,
    inputData?: Record<string, any>
  ): Promise<WorkflowExecution | null> => {
    try {
      const execution = await workflowService.executeWorkflow(workflowId, inputData);
      toast.success('Workflow ejecutándose...');
      return execution;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Duplicar workflow
  const duplicateWorkflow = async (workflowId: string): Promise<Workflow | null> => {
    if (!user) return null;

    try {
      const duplicated = await workflowService.duplicateWorkflow(workflowId, user.id);
      setWorkflows(prev => [duplicated, ...prev]);
      toast.success('Workflow duplicado');
      return duplicated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [user]);

  return {
    workflows,
    loading,
    error,
    loadWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    pauseWorkflow,
    executeWorkflow,
    duplicateWorkflow
  };
}

export function useWorkflow(workflowId: string | undefined) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar workflow
  const loadWorkflow = async () => {
    if (!workflowId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [workflowData, executionsData, statsData] = await Promise.all([
        workflowService.getWorkflow(workflowId),
        workflowService.getWorkflowExecutions(workflowId),
        workflowService.getWorkflowStats(workflowId)
      ]);

      setWorkflow(workflowData);
      setExecutions(executionsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar workflow');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar workflow
  const updateWorkflow = async (input: UpdateWorkflowInput): Promise<Workflow | null> => {
    if (!workflowId) return null;

    try {
      const updated = await workflowService.updateWorkflow(workflowId, input);
      setWorkflow(updated);
      toast.success('Workflow actualizado');
      return updated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  return {
    workflow,
    executions,
    stats,
    loading,
    error,
    loadWorkflow,
    updateWorkflow
  };
}

