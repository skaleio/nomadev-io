import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  X,
  MessageSquare,
  Grid3X3,
  List,
  Settings,
  ArrowUpDown,
  EyeOff,
  Users,
  Target,
  Activity,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  source: string;
  lastContact: string;
  avatar?: string;
  notes?: string;
  conversation?: ConversationMessage[];
}

interface ConversationMessage {
  id: string;
  sender: 'client' | 'agent';
  message: string;
  timestamp: string;
  type: 'text' | 'document' | 'system_notification';
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  leads: Lead[];
  totalValue: number;
}

const formatCrmCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const CRMPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  
  // Estados para personalización de vista
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'lastContact' | 'company'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showColumns, setShowColumns] = useState({
    avatar: true,
    company: true,
    value: true,
    source: true,
    lastContact: true,
    notes: true
  });

  // Datos reales - pipeline vacío hasta conectar con Shopify
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    {
      id: 'nuevo',
      name: 'Nuevo',
      color: 'bg-blue-500 text-white',
      totalValue: 0,
      leads: []
    },
    {
      id: 'calificado',
      name: 'Calificado',
      color: 'bg-yellow-500 text-white',
      totalValue: 0,
      leads: []
    },
    {
      id: 'propuesta',
      name: 'Propuesta',
      color: 'bg-orange-500 text-white',
      totalValue: 0,
      leads: []
    },
    {
      id: 'negociacion',
      name: 'Negociación',
      color: 'bg-purple-500 text-white',
      totalValue: 0,
      leads: []
    },
    {
      id: 'cerrado',
      name: 'Cerrado',
      color: 'bg-green-500 text-white',
      totalValue: 0,
      leads: []
    }
  ]);

  useDocumentTitle('CRM - NOMADEV.IO');

  // Cargar datos reales cuando esté conectado
  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    try {
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data, error } = await supabase
      //   .from('crm_leads')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      // 
      // if (error) {
      //   console.error('Error fetching CRM data:', error);
      //   return;
      // }
      // 
      // // Procesar datos y actualizar pipeline
      // const processedStages = processLeadsToStages(data || []);
      // setPipelineStages(processedStages);
      
      console.log('CRM data loaded - pipeline empty until Shopify connection');
    } catch (error) {
      console.error('Error loading CRM data:', error);
    }
  };

  const processLeadsToStages = (leads: Lead[]): PipelineStage[] => {
    const stages = pipelineStages.map(stage => ({
      ...stage,
      leads: leads.filter(lead => lead.source === stage.id),
      totalValue: leads
        .filter(lead => lead.source === stage.id)
        .reduce((sum, lead) => sum + lead.value, 0)
    }));
    return stages;
  };

  const STALE_CONTACT_DAYS = 7;

  // KPIs calculados desde los leads en cada etapa (fuente única de verdad)
  const crmMetrics = useMemo(() => {
    const stageValue = (s: PipelineStage) =>
      s.leads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);

    const totalLeads = pipelineStages.reduce((sum, s) => sum + s.leads.length, 0);
    const openStages = pipelineStages.filter((s) => s.id !== 'cerrado');
    const closedStage = pipelineStages.find((s) => s.id === 'cerrado');
    const openPipelineValue = openStages.reduce((sum, s) => sum + stageValue(s), 0);
    const closedValue = closedStage ? stageValue(closedStage) : 0;
    const closedCount = closedStage?.leads.length ?? 0;

    const nuevoStage = pipelineStages.find((s) => s.id === 'nuevo');
    const nuevoCount = nuevoStage?.leads.length ?? 0;

    const progressIds = ['calificado', 'propuesta', 'negociacion'] as const;
    const inProgressCount = progressIds.reduce((acc, id) => {
      const st = pipelineStages.find((s) => s.id === id);
      return acc + (st?.leads.length ?? 0);
    }, 0);

    const now = Date.now();
    const staleMs = STALE_CONTACT_DAYS * 24 * 60 * 60 * 1000;
    let staleFollowUpCount = 0;
    for (const stage of pipelineStages) {
      if (stage.id === 'cerrado') continue;
      for (const lead of stage.leads) {
        const t = new Date(lead.lastContact).getTime();
        if (!Number.isNaN(t) && now - t > staleMs) staleFollowUpCount++;
      }
    }

    const totalWeightedValue = pipelineStages.reduce((sum, s) => sum + stageValue(s), 0);
    const avgTicket = totalLeads > 0 ? totalWeightedValue / totalLeads : 0;
    const conversionRate = totalLeads > 0 ? (closedCount / totalLeads) * 100 : 0;

    const iconWrap = {
      default: 'rounded-lg bg-gray-800/80 p-2 text-gray-300',
      positive: 'rounded-lg bg-emerald-500/15 p-2 text-emerald-400',
      pipeline: 'rounded-lg bg-sky-500/15 p-2 text-sky-400',
      warning: 'rounded-lg bg-amber-500/15 p-2 text-amber-400',
      danger: 'rounded-lg bg-red-500/15 p-2 text-red-400',
    } as const;

    return [
      {
        title: 'Leads totales',
        hint: 'En todas las etapas del pipeline',
        value: totalLeads.toLocaleString('es-CL'),
        icon: Users,
        iconClass: iconWrap.default,
      },
      {
        title: 'Valor pipeline abierto',
        hint: 'Oportunidades fuera de “Cerrado”',
        value: formatCrmCurrency(openPipelineValue),
        icon: TrendingUp,
        iconClass: iconWrap.pipeline,
      },
      {
        title: 'Valor ganado',
        hint: 'Suma en etapa Cerrado',
        value: formatCrmCurrency(closedValue),
        icon: CheckCircle,
        iconClass: iconWrap.positive,
      },
      {
        title: 'Tasa de cierre',
        hint: 'Leads cerrados / leads totales',
        value: totalLeads > 0 ? `${conversionRate.toFixed(1)} %` : '—',
        icon: Target,
        iconClass: iconWrap.positive,
      },
      {
        title: 'Ticket medio',
        hint: 'Valor promedio por lead',
        value: totalLeads > 0 ? formatCrmCurrency(avgTicket) : '—',
        icon: DollarSign,
        iconClass: iconWrap.default,
      },
      {
        title: 'Nuevos (entrantes)',
        hint: 'En etapa Nuevo',
        value: nuevoCount.toLocaleString('es-CL'),
        icon: Inbox,
        iconClass: iconWrap.pipeline,
      },
      {
        title: 'En progreso',
        hint: 'Calificado, Propuesta o Negociación',
        value: inProgressCount.toLocaleString('es-CL'),
        icon: Activity,
        iconClass: iconWrap.default,
      },
      {
        title: 'Sin seguimiento',
        hint: `Sin contacto hace más de ${STALE_CONTACT_DAYS} días (excl. cerrados)`,
        value: staleFollowUpCount.toLocaleString('es-CL'),
        icon: AlertTriangle,
        iconClass: staleFollowUpCount > 0 ? iconWrap.danger : iconWrap.default,
      },
    ];
  }, [pipelineStages]);

  const handleAddLead = async (leadData: Partial<Lead>) => {
    try {
      // TODO: Implementar creación real de lead
      // const { data, error } = await supabase
      //   .from('crm_leads')
      //   .insert([{
      //     ...leadData,
      //     created_at: new Date().toISOString()
      //   }])
      //   .select();
      // 
      // if (error) {
      //   console.error('Error creating lead:', error);
      //   return;
      // }
      
      console.log('Lead created:', leadData);
      // Recargar datos
      loadCRMData();
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      // TODO: Implementar actualización real de lead
      // const { error } = await supabase
      //   .from('crm_leads')
      //   .update(updates)
      //   .eq('id', leadId);
      // 
      // if (error) {
      //   console.error('Error updating lead:', error);
      //   return;
      // }
      
      console.log('Lead updated:', leadId, updates);
      // Recargar datos
      loadCRMData();
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      // TODO: Implementar eliminación real de lead
      // const { error } = await supabase
      //   .from('crm_leads')
      //   .delete()
      //   .eq('id', leadId);
      // 
      // if (error) {
      //   console.error('Error deleting lead:', error);
      //   return;
      // }
      
      console.log('Lead deleted:', leadId);
      // Recargar datos
      loadCRMData();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const filteredStages = useMemo(() => {
    if (!searchTerm && !selectedStage) return pipelineStages;
    
    return pipelineStages.map(stage => ({
      ...stage,
      leads: stage.leads.filter(lead => {
        const matchesSearch = !searchTerm || 
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStage = !selectedStage || stage.id === selectedStage;
        
        return matchesSearch && matchesStage;
      })
    }));
  }, [pipelineStages, searchTerm, selectedStage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">CRM</h1>
            <p className="text-gray-400 mt-1">Gestiona tus leads y oportunidades de venta</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* KPIs — lectura rápida del estado del pipeline */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Métricas clave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {crmMetrics.map((metric) => (
              <Card
                key={metric.title}
                className="bg-gray-900/50 border-gray-700/80 hover:border-gray-600/80 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-gray-400 text-sm font-medium leading-tight">{metric.title}</p>
                      <p className="text-2xl font-bold text-white tracking-tight truncate" title={metric.value}>
                        {metric.value}
                      </p>
                      <p className="text-gray-500 text-xs leading-snug">{metric.hint}</p>
                    </div>
                    <div className={metric.iconClass} aria-hidden>
                      <metric.icon className="w-5 h-5 shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedStage || 'all'} onValueChange={(value) => setSelectedStage(value === 'all' ? null : value)}>
                    <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Filtrar por etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las etapas</SelectItem>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="calificado">Calificado</SelectItem>
                      <SelectItem value="propuesta">Propuesta</SelectItem>
                      <SelectItem value="negociacion">Negociación</SelectItem>
                      <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pipeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Pipeline de Ventas</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {filteredStages.map((stage) => (
              <Card key={stage.id} className="bg-gray-900/50 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">{stage.name}</CardTitle>
                    <Badge className={`${stage.color} text-xs`}>
                      {stage.leads.length}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs">
                    {formatCrmCurrency(stage.totalValue)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stage.leads.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No hay leads</p>
                    </div>
                  ) : (
                    stage.leads.map((lead) => (
                      <Card 
                        key={lead.id} 
                        className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gray-700 text-white text-xs">
                                  {lead.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-white font-medium text-sm">{lead.name}</p>
                                <p className="text-gray-400 text-xs">{lead.company}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedLead(lead);
                                  setIsEditing(true);
                                  setEditForm(lead);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="space-y-1">
                            <p className="text-green-400 font-semibold text-sm">
                              {formatCrmCurrency(lead.value)}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Último contacto: {formatDate(lead.lastContact)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal para ver/editar lead */}
        <Dialog open={isModalOpen || !!selectedLead} onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setSelectedLead(null);
            setIsEditing(false);
            setEditForm({});
          }
        }}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {isEditing ? 'Editar Lead' : selectedLead ? 'Detalles del Lead' : 'Nuevo Lead'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedLead && !isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Nombre</Label>
                      <p className="text-white">{selectedLead.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Empresa</Label>
                      <p className="text-white">{selectedLead.company}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Email</Label>
                      <p className="text-white">{selectedLead.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Teléfono</Label>
                      <p className="text-white">{selectedLead.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Valor</Label>
                      <p className="text-green-400 font-semibold">{formatCrmCurrency(selectedLead.value)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Fuente</Label>
                      <p className="text-white">{selectedLead.source}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Último Contacto</Label>
                      <p className="text-white">{formatDate(selectedLead.lastContact)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Notas</Label>
                      <p className="text-white">{selectedLead.notes || 'Sin notas'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setIsEditing(true);
                      setEditForm(selectedLead);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowConversation(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ver Conversación
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-400">Nombre *</Label>
                    <Input
                      id="name"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-gray-400">Empresa *</Label>
                    <Input
                      id="company"
                      value={editForm.company || ''}
                      onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-400">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-400">Teléfono</Label>
                    <Input
                      id="phone"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value" className="text-gray-400">Valor</Label>
                    <Input
                      id="value"
                      type="number"
                      value={editForm.value || ''}
                      onChange={(e) => setEditForm({...editForm, value: Number(e.target.value)})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source" className="text-gray-400">Fuente</Label>
                    <Select value={editForm.source || ''} onValueChange={(value) => setEditForm({...editForm, source: value})}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Seleccionar fuente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Referido">Referido</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Teléfono">Teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-gray-400">Notas</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (isEditing && selectedLead) {
                        handleUpdateLead(selectedLead.id, editForm);
                      } else {
                        handleAddLead(editForm);
                      }
                      setIsModalOpen(false);
                      setSelectedLead(null);
                      setIsEditing(false);
                      setEditForm({});
                    }}
                  >
                    {isEditing ? 'Actualizar' : 'Crear'} Lead
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedLead(null);
                      setIsEditing(false);
                      setEditForm({});
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CRMPage;