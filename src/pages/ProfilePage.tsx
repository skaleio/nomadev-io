import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Settings,
  Upload
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Actualizar perfil en la base de datos
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      
      setIsEditing(false);
      // Los datos del usuario se actualizarán automáticamente en el contexto
      // y por tanto en el sidebar también
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setProfileImage(user?.avatar || null);
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }

      // Crear URL temporal para previsualización
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Usuario */}
          <div className="lg:col-span-2">
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Información Personal</h3>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Tu dirección"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar de Información */}
          <div className="space-y-6">
            {/* Avatar y Estado */}
            <Card className="glass-card p-6">
              <div className="text-center">
                <div className={`relative inline-block ${isEditing ? 'overflow-hidden isolate' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  
                  {isEditing && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <label
                        htmlFor="profile-image-upload"
                        className="bg-gray-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-gray-700 transition-colors shadow-lg"
                        title="Cambiar imagen"
                      >
                        <Settings className="w-3 h-3" />
                      </label>
                    </div>
                  )}
                  
                  <label htmlFor="profile-image-upload" className={`cursor-pointer ${isEditing ? 'block' : 'block'}`}>
                    <div className="relative group">
                      <Avatar className={`w-20 h-20 mx-auto mb-4 border-0 outline-none ring-0 ${isEditing ? 'hover:opacity-80 transition-opacity' : ''}`}>
                        {profileImage ? (
                          <AvatarImage src={profileImage} alt="Profile" className="border-0 outline-none ring-0" />
                        ) : (
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl font-bold border-0 outline-none ring-0">
                            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {isEditing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="text-white text-center">
                            <Settings className="w-6 h-6 mx-auto mb-1" />
                            <span className="text-xs font-medium">Cambiar</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                
                <h3 className="text-lg font-semibold mb-1">
                  {user?.firstName || user?.email?.split('@')[0] || 'Usuario'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {user?.email}
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <User className="w-3 h-3 mr-1" />
                  Activo
                </Badge>
              </div>
            </Card>

            {/* Información de Cuenta */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Información de Cuenta</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Miembro desde</p>
                    <p className="text-xs text-muted-foreground">Enero 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email verificado</p>
                    <p className="text-xs text-muted-foreground">Sí</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">ID de Usuario</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {user?.id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
