import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewDashboardLayout } from "@/components/dashboard/NewDashboardLayout";
import { 
  Bot, 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  Trash2,
  Edit,
  Copy,
  Eye,
  Calendar,
  Users,
  Activity,
  Zap,
  Brain,
  MessageSquare,
  ShoppingCart,
  BarChart3,
  Globe,
  Mail,
  Clock,
  X,
  Save,
  AlertCircle,
  Sparkles,
  Loader2
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { Agent } from '@/lib/services/agent-service';

interface AgentProject {
  id: string;
  name: string;
  description: string;
  type: 'chatbot' | 'automation' | 'analytics' | 'integration' | 'custom';
  status: 'active' | 'paused' | 'draft' | 'error';
  lastRun: string;
  runs: number;
  successRate: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  icon: React.ComponentType<any>;
  color: string;
}

const mockProjects: AgentProject[] = [
  {
    id: '1',
    name: 'Asistente de Ventas Shopify',
    description: 'Chatbot inteligente que ayuda a los clientes con consultas de productos y procesamiento de pedidos',
    type: 'chatbot',
    status: 'active',
    lastRun: '2024-01-15T10:30:00Z',
    runs: 1247,
    successRate: 94.2,
    tags: ['Shopify', 'Ventas', 'Chatbot'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    icon: MessageSquare,
    color: 'bg-green-500'
  },
  {
    id: '2',
    name: 'Analizador de Competencia',
    description: 'Agente que monitorea precios y productos de la competencia para optimizar estrategias',
    type: 'analytics',
    status: 'active',
    lastRun: '2024-01-15T09:15:00Z',
    runs: 89,
    successRate: 98.9,
    tags: ['Análisis', 'Competencia', 'Precios'],
    createdAt: '2024-01-08T14:20:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
    icon: BarChart3,
    color: 'bg-blue-500'
  },
  {
    id: '3',
    name: 'Automatizador de Inventario',
    description: 'Sistema que actualiza automáticamente el stock y notifica cuando hay productos agotados',
    type: 'automation',
    status: 'paused',
    lastRun: '2024-01-14T16:45:00Z',
    runs: 234,
    successRate: 87.6,
    tags: ['Inventario', 'Automatización', 'Stock'],
    createdAt: '2024-01-05T11:30:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
    icon: ShoppingCart,
    color: 'bg-orange-500'
  },
  {
    id: '4',
    name: 'Generador de Contenido SEO',
    description: 'IA que crea automáticamente descripciones de productos optimizadas para SEO',
    type: 'custom',
    status: 'draft',
    lastRun: null,
    runs: 0,
    successRate: 0,
    tags: ['SEO', 'Contenido', 'IA'],
    createdAt: '2024-01-12T08:15:00Z',
    updatedAt: '2024-01-12T08:15:00Z',
    icon: Brain,
    color: 'bg-purple-500'
  },
  {
    id: '5',
    name: 'Integrador de Redes Sociales',
    description: 'Conecta automáticamente las ventas con publicaciones en Instagram y Facebook',
    type: 'integration',
    status: 'active',
    lastRun: '2024-01-15T11:00:00Z',
    runs: 456,
    successRate: 92.1,
    tags: ['Social Media', 'Integración', 'Marketing'],
    createdAt: '2024-01-03T13:45:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    icon: Globe,
    color: 'bg-pink-500'
  },
  {
    id: '6',
    name: 'Notificador de Pedidos',
    description: 'Envía emails automáticos a clientes con actualizaciones del estado de sus pedidos',
    type: 'automation',
    status: 'error',
    lastRun: '2024-01-15T08:20:00Z',
    runs: 789,
    successRate: 76.3,
    tags: ['Email', 'Pedidos', 'Notificaciones'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T08:20:00Z',
    icon: Mail,
    color: 'bg-red-500'
  }
];

const projectTypes = [
  { type: 'all', label: 'Todos', icon: Bot, color: 'bg-gray-500' },
  { type: 'chatbot', label: 'Chatbots', icon: MessageSquare, color: 'bg-green-500' },
  { type: 'automation', label: 'Automatización', icon: Zap, color: 'bg-orange-500' },
  { type: 'analytics', label: 'Analytics', icon: BarChart3, color: 'bg-blue-500' },
  { type: 'integration', label: 'Integraciones', icon: Globe, color: 'bg-pink-500' },
  { type: 'custom', label: 'Personalizados', icon: Brain, color: 'bg-purple-500' }
];

export default function AgentHubPage() {
  const navigate = useNavigate();
  
  // Usar el hook real de agentes
  const { 
    agents, 
    loading, 
    createAgent, 
    updateAgent, 
    deleteAgent, 
    activateAgent, 
    pauseAgent, 
    duplicateAgent 
  } = useAgents();
  
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'custom' as const,
    tags: [] as string[],
    tagInput: '',
    ai_system_prompt: '',
    personality: {
      tone: 'professional',
      language: 'es',
      style: 'friendly'
    }
  });

  // Filtrar agentes reales
  const filteredAgents = agents.filter(agent => {
    const matchesType = selectedType === 'all' || agent.type === selectedType;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (agent.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'paused': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'draft': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'paused': return 'Pausado';
      case 'draft': return 'Borrador';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Ayer';
    return date.toLocaleDateString('es-ES');
  };

  const handleProjectAction = (projectId: string, action: string) => {
    switch (action) {
      case 'play':
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status: 'active' as const } : p
        ));
        break;
      case 'pause':
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status: 'paused' as const } : p
        ));
        break;
      case 'delete':
        setProjects(prev => prev.filter(p => p.id !== projectId));
        break;
      case 'duplicate':
        const projectToDuplicate = projects.find(p => p.id === projectId);
        if (projectToDuplicate) {
          const duplicatedProject = {
            ...projectToDuplicate,
            id: Date.now().toString(),
            name: `${projectToDuplicate.name} (Copia)`,
            status: 'draft' as const,
            runs: 0,
            successRate: 0,
            lastRun: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setProjects(prev => [...prev, duplicatedProject]);
        }
        break;
      case 'edit':
        const projectToEdit = projects.find(p => p.id === projectId);
        if (projectToEdit) {
          setEditingProject(projectToEdit);
          setNewProject({
            name: projectToEdit.name,
            description: projectToEdit.description,
            type: projectToEdit.type,
            tags: [...projectToEdit.tags],
            tagInput: ''
          });
          setShowCreateModal(true);
        }
        break;
    }
  };

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const projectType = projectTypes.find(t => t.type === newProject.type);
    const newAgentProject: AgentProject = {
      id: editingProject ? editingProject.id : Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      type: newProject.type,
      status: editingProject ? editingProject.status : 'draft',
      lastRun: editingProject ? editingProject.lastRun : null,
      runs: editingProject ? editingProject.runs : 0,
      successRate: editingProject ? editingProject.successRate : 0,
      tags: newProject.tags,
      createdAt: editingProject ? editingProject.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: projectType?.icon || Bot,
      color: projectType?.color || 'bg-gray-500'
    };

    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? newAgentProject : p));
    } else {
      setProjects(prev => [...prev, newAgentProject]);
    }

    // Reset form
    setNewProject({
      name: '',
      description: '',
      type: 'custom',
      tags: [],
      tagInput: ''
    });
    setEditingProject(null);
    setShowCreateModal(false);

    // Redirigir al AgentBuilderPage
    navigate('/agent-builder');
  };

  const handleImproveIdea = () => {
    // Simular mejora de la idea con IA
    const improvedDescriptions = [
      "Eres un asistente virtual especializado en atención al cliente para ecommerce. Tu objetivo es proporcionar respuestas rápidas, precisas y amigables a las consultas de los visitantes, ayudándoles a encontrar productos, resolver dudas sobre envíos, devoluciones y garantías, y guiándolos hacia la conversión.",
      "Asistente de IA diseñado para optimizar la experiencia del cliente en tu tienda online. Proporciona información detallada sobre productos, procesa consultas de soporte, gestiona pedidos y mejora la satisfacción del cliente con respuestas personalizadas y eficientes.",
      "Agente inteligente de atención al cliente que combina conocimiento del catálogo de productos con habilidades de venta consultiva. Ayuda a los visitantes a tomar decisiones informadas, resuelve problemas técnicos y aumenta las conversiones mediante una comunicación clara y persuasiva."
    ];
    
    const randomImprovement = improvedDescriptions[Math.floor(Math.random() * improvedDescriptions.length)];
    setNewProject(prev => ({ ...prev, description: randomImprovement }));
  };

  const handleAddTag = () => {
    if (newProject.tagInput.trim() && !newProject.tags.includes(newProject.tagInput.trim())) {
      setNewProject(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewProject(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    setNewProject({
      name: '',
      description: '',
      type: 'custom',
      tags: [],
      tagInput: ''
    });
  };

  return (
    <NewDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Agent Builder</h1>
                <p className="text-gray-400 text-sm">Gestiona y crea agentes de IA para tu ecommerce</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Agente
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
                <p className="text-gray-400 text-sm">Total Agentes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {projects.filter(p => p.status === 'active').length}
                </p>
                <p className="text-gray-400 text-sm">Activos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {projects.reduce((sum, p) => sum + p.runs, 0).toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">Ejecuciones</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.successRate, 0) / projects.length) : 0}%
                </p>
                <p className="text-gray-400 text-sm">Éxito Promedio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar agentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
          
          {/* Type Filters */}
          <div className="flex gap-2 overflow-x-auto">
            {projectTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    selectedType === type.type
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-6 h-6 ${type.color} rounded flex items-center justify-center`}>
                    <IconComponent className="w-3 h-3 text-white" />
                  </div>
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mb-6">
              <Bot className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No hay agentes</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              {searchQuery || selectedType !== 'all' 
                ? 'No se encontraron agentes con los filtros aplicados'
                : 'Crea tu primer agente de IA para automatizar tareas de tu ecommerce'
              }
            </p>
            <Button 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Agente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const IconComponent = project.icon;
              return (
                <div
                  key={project.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${project.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {project.name}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(project.status)}`}
                        >
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleProjectAction(project.id, 'play')}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
                        title="Activar"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleProjectAction(project.id, 'pause')}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded transition-colors"
                        title="Pausar"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <div className="relative group/menu">
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 min-w-[160px]">
                          <button
                            onClick={() => handleProjectAction(project.id, 'duplicate')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleProjectAction(project.id, 'edit')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleProjectAction(project.id, 'view')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalles
                          </button>
                          <div className="border-t border-gray-600"></div>
                          <button
                            onClick={() => handleProjectAction(project.id, 'delete')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{project.runs.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Ejecuciones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{project.successRate}%</p>
                      <p className="text-xs text-gray-400">Éxito</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{formatDate(project.lastRun)}</p>
                      <p className="text-xs text-gray-400">Última ejecución</p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar Agente
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingProject ? 'Editar Agente' : 'Crear Nuevo Agente'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {editingProject ? 'Modifica la configuración de tu agente' : 'Configura un nuevo agente de IA para tu ecommerce'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre del Agente *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Asistente de Ventas Inteligente"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Agent Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Descripción
                  </label>
                  <Button
                    type="button"
                    onClick={handleImproveIdea}
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mejorar Idea
                  </Button>
                </div>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe qué hace tu agente y cómo ayuda a tu negocio..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Agent Type */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Tipo de Agente
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {projectTypes.slice(1).map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.type}
                        onClick={() => setNewProject(prev => ({ ...prev, type: type.type as any }))}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                          newProject.type === type.type
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {newProject.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 text-sm rounded-lg border border-cyan-500/40"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-cyan-300 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProject.tagInput}
                    onChange={(e) => setNewProject(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Agregar etiqueta..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {newProject.name && (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Vista Previa</h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${projectTypes.find(t => t.type === newProject.type)?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="text-white font-medium">{newProject.name}</h5>
                      <p className="text-gray-400 text-sm">{newProject.description || 'Sin descripción'}</p>
                      {newProject.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {newProject.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {newProject.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                              +{newProject.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>Los agentes se crean en estado borrador por defecto</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingProject ? 'Guardar Cambios' : 'Crear Agente'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </NewDashboardLayout>
  );
}
