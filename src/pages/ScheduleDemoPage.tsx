import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Calendar,
  Clock,
  Users,
  CheckCircle,
  ArrowLeft,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Video,
  X,
  Building,
  User,
  Briefcase
} from 'lucide-react';

const ScheduleDemoPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    tamaño: '',
    nicho: '',
    mensaje: ''
  });

  const handleScheduleDemo = () => {
    setShowModal(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes enviar los datos a tu backend o servicio de email
    console.log('Datos del formulario:', formData);
    alert('¡Gracias! Nos pondremos en contacto contigo pronto.');
    setShowModal(false);
    setFormData({
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      tamaño: '',
      nicho: '',
      mensaje: ''
    });
  };

  const handleBackToLanding = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div
              className="text-4xl font-black text-emerald-400 transition-all duration-300 tracking-wider uppercase"
              style={{
                fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                fontWeight: 900,
                letterSpacing: '0.15em',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                transform: 'skew(-3deg)',
                display: 'inline-block',
                filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.6))'
              }}
            >
              NOMADEV.IO
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            ¡Demo Completado!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Has visto todas las herramientas de nuestro sistema. ¿Te gustaría agendar una demostración personalizada con nuestro equipo?
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Side - Demo Summary */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
                Lo que has visto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Validador de Clientes - Sistema anti-fraude</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Shopify Analytics - Métricas en tiempo real</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Chat en Vivo - Atención al cliente</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Validación de Pedidos - Automatización</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Seguimiento de Envíos - Rastreo completo</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Gestor de Leads - CRM integrado</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Configuración - Control total del sistema</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Schedule Demo */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-emerald-400" />
                Agenda tu Demo Personalizada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300">
                Reserva 30 minutos con nuestro equipo para una demostración personalizada adaptada a tu negocio.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  <span>30 minutos de demostración</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <span>Con nuestro equipo de expertos</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <MessageSquare className="h-5 w-5 text-emerald-400" />
                  <span>Respuestas a todas tus preguntas</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Star className="h-5 w-5 text-emerald-400" />
                  <span>Casos de uso específicos para tu industria</span>
                </div>
              </div>

              <Button 
                onClick={handleScheduleDemo}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Agendar Demo Ahora
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Options */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl text-center">
              ¿Prefieres otro método de contacto?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-16"
                onClick={() => window.open('mailto:demo@nomadev.io', '_blank')}
              >
                <Mail className="h-5 w-5 mr-2" />
                Enviar Email
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-16"
                onClick={() => window.open('tel:+1234567890', '_blank')}
              >
                <Phone className="h-5 w-5 mr-2" />
                Llamar Ahora
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-16"
                onClick={() => window.open('https://wa.me/1234567890', '_blank')}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Landing */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={handleBackToLanding}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inicio
          </Button>
        </div>
      </div>

      {/* Modal del Formulario */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Agendar Demo Personalizada
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Completa el formulario y nos pondremos en contacto contigo para coordinar tu demostración personalizada.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline mr-1" />
                  Nombre Completo *
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-sm font-medium text-gray-700">
                  <Building className="h-4 w-4 inline mr-1" />
                  Empresa *
                </Label>
                <Input
                  id="empresa"
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => handleInputChange('empresa', e.target.value)}
                  placeholder="Nombre de tu empresa"
                  required
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="+34 600 123 456"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* Tamaño de Empresa */}
              <div className="space-y-2">
                <Label htmlFor="tamaño" className="text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 inline mr-1" />
                  Tamaño de Empresa
                </Label>
                <Select value={formData.tamaño} onValueChange={(value) => handleInputChange('tamaño', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Selecciona el tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-10 empleados)</SelectItem>
                    <SelectItem value="pequeña">Pequeña (11-50 empleados)</SelectItem>
                    <SelectItem value="mediana">Mediana (51-200 empleados)</SelectItem>
                    <SelectItem value="grande">Grande (201-1000 empleados)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+ empleados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nicho/Industria */}
              <div className="space-y-2">
                <Label htmlFor="nicho" className="text-sm font-medium text-gray-700">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Industria/Nicho
                </Label>
                <Select value={formData.nicho} onValueChange={(value) => handleInputChange('nicho', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Selecciona tu industria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="tecnologia">Tecnología</SelectItem>
                    <SelectItem value="salud">Salud</SelectItem>
                    <SelectItem value="educacion">Educación</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
                    <SelectItem value="manufactura">Manufactura</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
              <Label htmlFor="mensaje" className="text-sm font-medium text-gray-700">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Mensaje Adicional
              </Label>
              <Textarea
                id="mensaje"
                value={formData.mensaje}
                onChange={(e) => handleInputChange('mensaje', e.target.value)}
                placeholder="Cuéntanos sobre tu negocio y qué te gustaría ver en la demo..."
                rows={4}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Demo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleDemoPage;
