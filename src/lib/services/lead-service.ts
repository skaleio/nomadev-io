/**
 * Servicio de Gestión de Leads y CRM
 * Maneja toda la lógica de clientes potenciales y gestión comercial
 */

import { supabase } from '@/integrations/supabase/client';
import { aiService } from './ai-service';

export interface Lead {
  id: string;
  user_id: string;
  agent_id?: string;
  conversation_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  score: number;
  estimated_value?: number;
  currency: string;
  probability: number;
  source?: string;
  campaign?: string;
  notes?: string;
  context: Record<string, any>;
  tags: string[];
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
  next_followup_at?: string;
  converted_at?: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  title?: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
}

export interface CreateLeadInput {
  agent_id?: string;
  conversation_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  campaign?: string;
  notes?: string;
  context?: Record<string, any>;
  tags?: string[];
  estimated_value?: number;
  currency?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: Lead['status'];
  score?: number;
  probability?: number;
  assigned_to?: string;
  next_followup_at?: string;
}

export interface CreateActivityInput {
  lead_id: string;
  activity_type: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  scheduled_at?: string;
}

class LeadService {
  /**
   * Obtener todos los leads del usuario
   */
  async getLeads(userId: string, filters?: {
    status?: Lead['status'];
    minScore?: number;
    assignedTo?: string;
  }): Promise<Lead[]> {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.minScore !== undefined) {
      query = query.gte('score', filters.minScore);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      throw new Error('Error al obtener leads');
    }

    return data as Lead[];
  }

  /**
   * Obtener un lead específico
   */
  async getLead(leadId: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching lead:', error);
      throw new Error('Error al obtener lead');
    }

    return data as Lead;
  }

  /**
   * Crear un nuevo lead
   */
  async createLead(userId: string, input: CreateLeadInput): Promise<Lead> {
    const leadData = {
      user_id: userId,
      agent_id: input.agent_id,
      conversation_id: input.conversation_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      position: input.position,
      status: 'new' as const,
      score: 0,
      estimated_value: input.estimated_value,
      currency: input.currency || 'USD',
      probability: 0,
      source: input.source,
      campaign: input.campaign,
      notes: input.notes,
      context: input.context || {},
      tags: input.tags || []
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      throw new Error('Error al crear lead');
    }

    // Registrar actividad de creación
    await this.createActivity(userId, {
      lead_id: data.id,
      activity_type: 'created',
      title: 'Lead creado',
      description: `Lead creado desde ${input.source || 'fuente desconocida'}`
    });

    return data as Lead;
  }

  /**
   * Actualizar un lead
   */
  async updateLead(leadId: string, userId: string, input: UpdateLeadInput): Promise<Lead> {
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.score !== undefined) updateData.score = input.score;
    if (input.estimated_value !== undefined) updateData.estimated_value = input.estimated_value;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.probability !== undefined) updateData.probability = input.probability;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.campaign !== undefined) updateData.campaign = input.campaign;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.context !== undefined) updateData.context = input.context;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.assigned_to !== undefined) updateData.assigned_to = input.assigned_to;
    if (input.next_followup_at !== undefined) updateData.next_followup_at = input.next_followup_at;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      throw new Error('Error al actualizar lead');
    }

    // Registrar actividad de actualización
    if (input.status) {
      await this.createActivity(userId, {
        lead_id: leadId,
        activity_type: 'status_change',
        title: 'Estado actualizado',
        description: `Estado cambiado a: ${input.status}`
      });
    }

    return data as Lead;
  }

  /**
   * Eliminar un lead
   */
  async deleteLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Error deleting lead:', error);
      throw new Error('Error al eliminar lead');
    }
  }

  /**
   * Calificar lead automáticamente con IA
   */
  async qualifyLead(leadId: string): Promise<Lead> {
    const lead = await this.getLead(leadId);
    
    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    // Obtener mensajes de la conversación si existe
    let conversationMessages: Array<{ role: string; content: string }> = [];
    
    if (lead.conversation_id) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content, direction')
        .eq('conversation_id', lead.conversation_id)
        .order('created_at', { ascending: true })
        .limit(20);

      if (messages) {
        conversationMessages = messages.map(m => ({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.content
        }));
      }
    }

    // Usar IA para clasificar el lead
    const classification = await aiService.classifyLead(
      conversationMessages,
      {
        name: lead.name,
        phone: lead.phone,
        email: lead.email
      }
    );

    // Actualizar lead con la clasificación
    const updatedLead = await this.updateLead(leadId, lead.user_id, {
      score: classification.score,
      status: classification.stage as Lead['status'],
      notes: lead.notes 
        ? `${lead.notes}\n\nClasificación automática: ${classification.reasoning}`
        : `Clasificación automática: ${classification.reasoning}`
    });

    // Registrar actividad
    await this.createActivity(lead.user_id, {
      lead_id: leadId,
      activity_type: 'ai_qualification',
      title: 'Lead calificado automáticamente',
      description: classification.reasoning,
      metadata: {
        score: classification.score,
        stage: classification.stage
      }
    });

    return updatedLead;
  }

  /**
   * Convertir lead (marcar como ganado)
   */
  async convertLead(leadId: string, userId: string): Promise<Lead> {
    const updatedLead = await this.updateLead(leadId, userId, {
      status: 'won',
      probability: 100
    });

    // Actualizar fecha de conversión
    await supabase
      .from('leads')
      .update({ converted_at: new Date().toISOString() })
      .eq('id', leadId);

    // Registrar actividad
    await this.createActivity(userId, {
      lead_id: leadId,
      activity_type: 'converted',
      title: 'Lead convertido',
      description: 'Lead marcado como ganado'
    });

    return updatedLead;
  }

  /**
   * Marcar lead como perdido
   */
  async loseLead(leadId: string, userId: string, reason?: string): Promise<Lead> {
    const updatedLead = await this.updateLead(leadId, userId, {
      status: 'lost',
      probability: 0,
      notes: reason
    });

    // Registrar actividad
    await this.createActivity(userId, {
      lead_id: leadId,
      activity_type: 'lost',
      title: 'Lead perdido',
      description: reason || 'Lead marcado como perdido'
    });

    return updatedLead;
  }

  /**
   * Crear actividad de lead
   */
  async createActivity(userId: string, input: CreateActivityInput): Promise<LeadActivity> {
    const activityData = {
      lead_id: input.lead_id,
      user_id: userId,
      activity_type: input.activity_type,
      title: input.title,
      description: input.description,
      metadata: input.metadata || {},
      scheduled_at: input.scheduled_at
    };

    const { data, error } = await supabase
      .from('lead_activities')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      throw new Error('Error al crear actividad');
    }

    // Actualizar last_contact_at del lead
    await supabase
      .from('leads')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('id', input.lead_id);

    return data as LeadActivity;
  }

  /**
   * Obtener actividades de un lead
   */
  async getLeadActivities(leadId: string, limit: number = 50): Promise<LeadActivity[]> {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Error al obtener actividades');
    }

    return data as LeadActivity[];
  }

  /**
   * Completar actividad
   */
  async completeActivity(activityId: string): Promise<LeadActivity> {
    const { data, error } = await supabase
      .from('lead_activities')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', activityId)
      .select()
      .single();

    if (error) {
      console.error('Error completing activity:', error);
      throw new Error('Error al completar actividad');
    }

    return data as LeadActivity;
  }

  /**
   * Obtener estadísticas de leads
   */
  async getLeadStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgScore: number;
    conversionRate: number;
    totalValue: number;
  }> {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, score, estimated_value')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching lead stats:', error);
      throw new Error('Error al obtener estadísticas');
    }

    const total = leads?.length || 0;
    
    const byStatus: Record<string, number> = {};
    let totalScore = 0;
    let totalValue = 0;
    let wonCount = 0;

    leads?.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      totalScore += lead.score || 0;
      totalValue += lead.estimated_value || 0;
      if (lead.status === 'won') wonCount++;
    });

    const avgScore = total > 0 ? totalScore / total : 0;
    const conversionRate = total > 0 ? (wonCount / total) * 100 : 0;

    return {
      total,
      byStatus,
      avgScore: Math.round(avgScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100
    };
  }

  /**
   * Buscar leads
   */
  async searchLeads(userId: string, query: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company.ilike.%${query}%`)
      .order('score', { ascending: false });

    if (error) {
      console.error('Error searching leads:', error);
      throw new Error('Error al buscar leads');
    }

    return data as Lead[];
  }

  /**
   * Obtener leads que requieren seguimiento
   */
  async getLeadsForFollowup(userId: string): Promise<Lead[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .lte('next_followup_at', now)
      .not('next_followup_at', 'is', null)
      .order('next_followup_at', { ascending: true });

    if (error) {
      console.error('Error fetching leads for followup:', error);
      throw new Error('Error al obtener leads para seguimiento');
    }

    return data as Lead[];
  }

  /**
   * Asignar lead a usuario
   */
  async assignLead(leadId: string, userId: string, assignToUserId: string): Promise<Lead> {
    const updatedLead = await this.updateLead(leadId, userId, {
      assigned_to: assignToUserId
    });

    await this.createActivity(userId, {
      lead_id: leadId,
      activity_type: 'assigned',
      title: 'Lead asignado',
      description: `Lead asignado a usuario ${assignToUserId}`
    });

    return updatedLead;
  }
}

export const leadService = new LeadService();

