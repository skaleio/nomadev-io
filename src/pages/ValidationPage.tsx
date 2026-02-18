import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  UserCheck, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard
} from 'lucide-react';

interface ValidationResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'pending' | 'validated' | 'rejected' | 'in_progress';
  validation_stage: 'identity' | 'address' | 'payment' | 'completed';
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function ValidationPage() {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadValidations();
  }, []);

  const loadValidations = async () => {
    try {
      setLoading(true);
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data, error } = await supabase
      //   .from('validation_results')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      // 
      // if (error) {
      //   console.error('Error fetching validations:', error);
      //   setValidations([]);
      // } else {
      //   setValidations(data || []);
      // }
      
      // Por ahora, usar lista vacía hasta conectar con Shopify
      setValidations([]);
    } catch (error) {
      console.error('Error loading validations:', error);
      setValidations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredValidations = validations.filter(validation => {
    const matchesSearch = validation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         validation.phone.includes(searchTerm) ||
                         validation.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || validation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'validated': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'validated': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'identity': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'address': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'payment': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleValidate = async (id: string, status: 'validated' | 'rejected') => {
    try {
      // TODO: Implementar validación real
      // const { error } = await supabase
      //   .from('validation_results')
      //   .update({ 
      //     status,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', id);
      // 
      // if (error) {
      //   console.error('Error updating validation:', error);
      //   return;
      // }
      
      // Actualizar estado local
      setValidations(prev => prev.map(v => 
        v.id === id ? { ...v, status, updated_at: new Date().toISOString() } : v
      ));
    } catch (error) {
      console.error('Error validating:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Validación de Clientes</h1>
            <p className="text-gray-400 mt-1">Gestiona la validación de identidad de tus clientes</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadValidations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Validaciones</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <UserCheck className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400">0</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Validados</p>
                  <p className="text-2xl font-bold text-green-400">0</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rechazados</p>
                  <p className="text-2xl font-bold text-red-400">0</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="validated">Validado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Validaciones */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Validaciones ({filteredValidations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Cargando validaciones...</span>
              </div>
            ) : filteredValidations.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No hay validaciones</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No se encontraron validaciones con los filtros aplicados'
                    : 'Conecta tu tienda Shopify para ver las validaciones aquí'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Conectar Shopify
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredValidations.map((validation) => (
                    <Card 
                      key={validation.id} 
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(validation.status)}
                              <span className="font-semibold text-white">{validation.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Phone className="w-4 h-4" />
                              <span>{validation.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Mail className="w-4 h-4" />
                              <span>{validation.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStageColor(validation.validation_stage)}>
                              {validation.validation_stage}
                            </Badge>
                            <Badge className={getStatusColor(validation.status)}>
                              {validation.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            <span>Creado: {formatDate(validation.created_at)}</span>
                            {validation.updated_at !== validation.created_at && (
                              <span className="ml-4">Actualizado: {formatDate(validation.updated_at)}</span>
                            )}
                          </div>
                          
                          {validation.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleValidate(validation.id, 'rejected')}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleValidate(validation.id, 'validated')}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Validar
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {validation.notes && (
                          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                            <p className="text-gray-300 text-sm">
                              <strong>Notas:</strong> {validation.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}