/**
 * Hook para gestión de agentes
 */

import { useState, useEffect } from 'react';
import { agentService, Agent, CreateAgentInput, UpdateAgentInput } from '@/lib/services/agent-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar agentes
  const loadAgents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await agentService.getAgents(user.id);
      setAgents(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar agentes');
    } finally {
      setLoading(false);
    }
  };

  // Crear agente
  const createAgent = async (input: CreateAgentInput): Promise<Agent | null> => {
    if (!user) return null;

    try {
      const newAgent = await agentService.createAgent(user.id, input);
      setAgents(prev => [newAgent, ...prev]);
      toast.success('Agente creado exitosamente');
      return newAgent;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Actualizar agente
  const updateAgent = async (agentId: string, input: UpdateAgentInput): Promise<Agent | null> => {
    try {
      const updatedAgent = await agentService.updateAgent(agentId, input);
      setAgents(prev => prev.map(a => a.id === agentId ? updatedAgent : a));
      toast.success('Agente actualizado');
      return updatedAgent;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Eliminar agente
  const deleteAgent = async (agentId: string): Promise<boolean> => {
    try {
      await agentService.deleteAgent(agentId);
      setAgents(prev => prev.filter(a => a.id !== agentId));
      toast.success('Agente eliminado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Activar agente
  const activateAgent = async (agentId: string): Promise<boolean> => {
    try {
      const updatedAgent = await agentService.activateAgent(agentId);
      setAgents(prev => prev.map(a => a.id === agentId ? updatedAgent : a));
      toast.success('Agente activado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Pausar agente
  const pauseAgent = async (agentId: string): Promise<boolean> => {
    try {
      const updatedAgent = await agentService.pauseAgent(agentId);
      setAgents(prev => prev.map(a => a.id === agentId ? updatedAgent : a));
      toast.success('Agente pausado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Duplicar agente
  const duplicateAgent = async (agentId: string): Promise<Agent | null> => {
    if (!user) return null;

    try {
      const duplicated = await agentService.duplicateAgent(agentId, user.id);
      setAgents(prev => [duplicated, ...prev]);
      toast.success('Agente duplicado');
      return duplicated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Cargar agentes al montar
  useEffect(() => {
    loadAgents();
  }, [user]);

  return {
    agents,
    loading,
    error,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    activateAgent,
    pauseAgent,
    duplicateAgent
  };
}

export function useAgent(agentId: string | undefined) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Cargar agente
  const loadAgent = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await agentService.getAgent(agentId);
      setAgent(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar agente');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    if (!agentId) return;

    try {
      const data = await agentService.getAgentStats(agentId);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading agent stats:', err);
    }
  };

  // Actualizar agente
  const updateAgent = async (input: UpdateAgentInput): Promise<Agent | null> => {
    if (!agentId) return null;

    try {
      const updated = await agentService.updateAgent(agentId, input);
      setAgent(updated);
      toast.success('Agente actualizado');
      return updated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  useEffect(() => {
    loadAgent();
    loadStats();
  }, [agentId]);

  return {
    agent,
    stats,
    loading,
    error,
    loadAgent,
    loadStats,
    updateAgent
  };
}

