/**
 * Hook para gestión de leads
 */

import { useState, useEffect } from 'react';
import { 
  leadService, 
  Lead, 
  LeadActivity,
  CreateLeadInput, 
  UpdateLeadInput,
  CreateActivityInput
} from '@/lib/services/lead-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useLeads(filters?: {
  status?: Lead['status'];
  minScore?: number;
  assignedTo?: string;
}) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Cargar leads
  const loadLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await leadService.getLeads(user.id, filters);
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar leads');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    if (!user) return;

    try {
      const data = await leadService.getLeadStats(user.id);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading lead stats:', err);
    }
  };

  // Crear lead
  const createLead = async (input: CreateLeadInput): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const newLead = await leadService.createLead(user.id, input);
      setLeads(prev => [newLead, ...prev]);
      toast.success('Lead creado exitosamente');
      return newLead;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Actualizar lead
  const updateLead = async (leadId: string, input: UpdateLeadInput): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const updated = await leadService.updateLead(leadId, user.id, input);
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      toast.success('Lead actualizado');
      return updated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Eliminar lead
  const deleteLead = async (leadId: string): Promise<boolean> => {
    try {
      await leadService.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      toast.success('Lead eliminado');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Calificar lead con IA
  const qualifyLead = async (leadId: string): Promise<Lead | null> => {
    try {
      const qualified = await leadService.qualifyLead(leadId);
      setLeads(prev => prev.map(l => l.id === leadId ? qualified : l));
      toast.success('Lead calificado automáticamente');
      return qualified;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Convertir lead
  const convertLead = async (leadId: string): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const converted = await leadService.convertLead(leadId, user.id);
      setLeads(prev => prev.map(l => l.id === leadId ? converted : l));
      toast.success('¡Lead convertido! 🎉');
      return converted;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Marcar como perdido
  const loseLead = async (leadId: string, reason?: string): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const lost = await leadService.loseLead(leadId, user.id, reason);
      setLeads(prev => prev.map(l => l.id === leadId ? lost : l));
      toast.success('Lead marcado como perdido');
      return lost;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  useEffect(() => {
    loadLeads();
    loadStats();
  }, [user, JSON.stringify(filters)]);

  return {
    leads,
    stats,
    loading,
    error,
    loadLeads,
    loadStats,
    createLead,
    updateLead,
    deleteLead,
    qualifyLead,
    convertLead,
    loseLead
  };
}

export function useLead(leadId: string | undefined) {
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar lead
  const loadLead = async () => {
    if (!leadId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [leadData, activitiesData] = await Promise.all([
        leadService.getLead(leadId),
        leadService.getLeadActivities(leadId)
      ]);

      setLead(leadData);
      setActivities(activitiesData);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar lead');
    } finally {
      setLoading(false);
    }
  };

  // Crear actividad
  const createActivity = async (input: CreateActivityInput): Promise<LeadActivity | null> => {
    if (!user) return null;

    try {
      const newActivity = await leadService.createActivity(user.id, input);
      setActivities(prev => [newActivity, ...prev]);
      toast.success('Actividad creada');
      return newActivity;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Completar actividad
  const completeActivity = async (activityId: string): Promise<boolean> => {
    try {
      const completed = await leadService.completeActivity(activityId);
      setActivities(prev => prev.map(a => a.id === activityId ? completed : a));
      toast.success('Actividad completada');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Actualizar lead
  const updateLead = async (input: UpdateLeadInput): Promise<Lead | null> => {
    if (!user || !leadId) return null;

    try {
      const updated = await leadService.updateLead(leadId, user.id, input);
      setLead(updated);
      toast.success('Lead actualizado');
      return updated;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  useEffect(() => {
    loadLead();
  }, [leadId]);

  return {
    lead,
    activities,
    loading,
    error,
    loadLead,
    createActivity,
    completeActivity,
    updateLead
  };
}

