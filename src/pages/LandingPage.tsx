import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe } from '@/components/ui/globe';
import { AvatarGroup, AvatarGroupTooltip } from '@/components/ui/avatar-group';
import RippleGrid from '@/components/RippleGrid';
import { HeroVideoDialog } from '@/components/ui/hero-video-dialog';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { Marquee } from '@/components/ui/marquee';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  Award,
  Quote,
  ChevronDown,
  Play,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X,
} from 'lucide-react';


// Datos de avatares para el AvatarGroup
const AVATARS = [
  {
    src: "https://i.pravatar.cc/64?img=1",
    fallback: "AG",
    tooltip: "Ana García - CEO Fashion Store"
  },
  {
    src: "https://i.pravatar.cc/64?img=2",
    fallback: "BL",
    tooltip: "Bruno López - Fundador TechGadgets"
  },
  {
    src: "https://i.pravatar.cc/64?img=3",
    fallback: "CR",
    tooltip: "Carmen Ruiz - Directora BeautyShop"
  },
  {
    src: "https://i.pravatar.cc/64?img=4",
    fallback: "DM",
    tooltip: "Diego Martín - Manager SportsStore"
  },
  {
    src: "https://i.pravatar.cc/64?img=5",
    fallback: "ET",
    tooltip: "Elena Torres - CEO HomeDecor"
  }
];

// Datos de testimonios para el Marquee
const TESTIMONIALS = [
  {
    id: 1,
    name: "María Carmen",
    role: "CEO, Fashion Store",
    initials: "MC",
    quote: "NOMADEV.IO revolucionó completamente nuestras ventas. Las conversiones aumentaron un 300% en solo 3 meses. Es impresionante.",
    gradient: "from-emerald-500 to-teal-600",
    quoteColor: "text-emerald-500",
    img: "https://i.pravatar.cc/64?img=1"
  },
  {
    id: 2,
    name: "José Luis",
    role: "Fundador, TechGadgets",
    initials: "JL",
    quote: "La integración con Shopify es perfecta. Ahora nuestros clientes reciben confirmaciones instantáneas por WhatsApp. Increíble experiencia.",
    gradient: "from-cyan-500 to-blue-600",
    quoteColor: "text-cyan-500",
    img: "https://i.pravatar.cc/64?img=2"
  },
  {
    id: 3,
    name: "Ana Rodríguez",
    role: "Directora, BeautyShop",
    initials: "AR",
    quote: "La automatización inteligente nos ahorra 20 horas semanales. NOMADEV.IO es la mejor inversión que hemos hecho.",
    gradient: "from-violet-500 to-purple-600",
    quoteColor: "text-violet-500",
    img: "https://i.pravatar.cc/64?img=3"
  },
  {
    id: 4,
    name: "Carlos Mendoza",
    role: "CEO, SportsStore",
    initials: "CM",
    quote: "Redujimos las devoluciones un 90% desde que implementamos NOMADEV.IO. Los clientes están más satisfechos que nunca.",
    gradient: "from-amber-500 to-orange-600",
    quoteColor: "text-amber-500",
    img: "https://i.pravatar.cc/64?img=4"
  },
  {
    id: 5,
    name: "Laura Fernández",
    role: "Directora, HomeDecor",
    initials: "LF",
    quote: "El soporte técnico es excepcional. Siempre están disponibles y resuelven cualquier duda al instante.",
    gradient: "from-rose-500 to-pink-600",
    quoteColor: "text-rose-500",
    img: "https://i.pravatar.cc/64?img=5"
  },
  {
    id: 6,
    name: "Roberto Silva",
    role: "Fundador, TechStore",
    initials: "RS",
    quote: "La escalabilidad es increíble. Pasamos de 50 a 500 pedidos diarios sin problemas. El sistema crece con nosotros.",
    gradient: "from-indigo-500 to-purple-600",
    quoteColor: "text-indigo-500",
    img: "https://i.pravatar.cc/64?img=6"
  },
  {
    id: 7,
    name: "Sofia Martínez",
    role: "CEO, EcoStore",
    initials: "SM",
    quote: "La integración fue súper fácil. En 5 minutos ya teníamos todo funcionando. Los clientes están encantados.",
    gradient: "from-green-500 to-emerald-600",
    quoteColor: "text-green-500",
    img: "https://i.pravatar.cc/64?img=7"
  },
  {
    id: 8,
    name: "Diego Herrera",
    role: "Fundador, TechGear",
    initials: "DH",
    quote: "NOMADEV.IO nos ayudó a reducir costos operativos un 40%. Es la herramienta que necesitábamos.",
    gradient: "from-blue-500 to-indigo-600",
    quoteColor: "text-blue-500",
    img: "https://i.pravatar.cc/64?img=8"
  }
];

// Dividir testimonios en dos filas
const firstRow = TESTIMONIALS.slice(0, TESTIMONIALS.length / 2);
const secondRow = TESTIMONIALS.slice(TESTIMONIALS.length / 2);

// Componente ReviewCard personalizado
const ReviewCard = ({
  img,
  name,
  role,
  quote,
  gradient,
  quoteColor
}: {
  img: string;
  name: string;
  role: string;
  quote: string;
  gradient: string;
  quoteColor: string;
}) => {
  return (
    <figure className="relative h-full w-80 cursor-pointer overflow-hidden rounded-xl border border-gray-700/50 bg-black/90 backdrop-blur-sm p-6 hover:bg-black/95 transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <div className="flex flex-row items-center gap-3 mb-4">
        <img 
          className="rounded-full w-12 h-12 object-cover border-2 border-gray-600" 
          alt={name} 
          src={img} 
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-semibold text-white">
            {name}
          </figcaption>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 text-amber-400 fill-current" />
            ))}
          </div>
        </div>
      </div>
      <blockquote className="text-sm text-gray-300 leading-relaxed">
        {quote}
      </blockquote>
    </figure>
  );
};

// Constantes para estilos reutilizables
const STYLES = {
  container: "container mx-auto px-4",
  section: "py-20 bg-black",
  card: "border-0 shadow-lg hover:shadow-xl transition-all duration-300",
  button: "transition-all duration-300",
  gradient: {
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
    cyan: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700",
    violet: "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
  },
  icon: {
    container: "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl",
    emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/20",
    cyan: "bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/20",
    violet: "bg-gradient-to-br from-violet-500 to-purple-600 border border-violet-400/20"
  }
} as const;

const LandingPage = memo(() => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Configuración personalizada del Globe
  const GLOBE_CONFIG = {
    width: 600,
    height: 600,
    onRender: () => {},
    devicePixelRatio: 2,
    phi: 0,
    theta: 0.3,
    dark: 1,
    diffuse: 0.4,
    mapSamples: 16000,
    mapBrightness: 4,
    baseColor: [0.1, 0.1, 0.1] as [number, number, number],
    markerColor: [0.2, 0.7, 0.4] as [number, number, number], // Verde emerald
    glowColor: [0.2, 0.7, 0.4] as [number, number, number], // Verde emerald
    markers: [
      { location: [40.7128, -74.006] as [number, number], size: 0.1 }, // New York
      { location: [51.5074, -0.1278] as [number, number], size: 0.1 }, // London
      { location: [35.6762, 139.6503] as [number, number], size: 0.1 }, // Tokyo
      { location: [-33.8688, 151.2093] as [number, number], size: 0.1 }, // Sydney
      { location: [48.8566, 2.3522] as [number, number], size: 0.1 }, // Paris
      { location: [37.7749, -122.4194] as [number, number], size: 0.1 }, // San Francisco
      { location: [55.7558, 37.6176] as [number, number], size: 0.1 }, // Moscow
      { location: [-22.9068, -43.1729] as [number, number], size: 0.1 }, // Rio de Janeiro
      { location: [19.4326, -99.1332] as [number, number], size: 0.1 }, // Mexico City
      { location: [28.6139, 77.2090] as [number, number], size: 0.1 }, // New Delhi
    ]
  };

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const toggleFAQ = useCallback((index: number) => {
    setOpenFAQ(prev => prev === index ? null : index);
  }, []);

  // Función para scroll suave a las secciones
  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    // Si el menú móvil está abierto, cerrarlo primero
    const shouldDelay = isMobileMenuOpen;
    if (shouldDelay) {
      setIsMobileMenuOpen(false);
    }
    
    // Función de scroll
    const performScroll = () => {
      const element = document.querySelector(sectionId);
      if (element) {
        const headerOffset = 80; // Altura del header sticky
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    };
    
    // En desktop, scroll inmediato. En móvil, esperar a que se cierre el menú
    if (shouldDelay) {
      setTimeout(performScroll, 300);
    } else {
      performScroll();
    }
  }, [isMobileMenuOpen]);

  return (
    <CustomCursor>
      <div className="landing-page min-h-screen transition-colors duration-300 bg-black m-0 p-0" style={{ margin: '0', padding: '0', marginTop: '0', paddingTop: '0' }}>
      {/* Header */}
      <header className="border-b backdrop-blur-md sticky top-0 z-50 shadow-lg transition-colors duration-300 border-gray-800 bg-black/90 m-0 p-0" style={{ marginTop: '0', paddingTop: '0', top: '0', transform: 'translateY(0)', position: 'sticky' }}>
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-3xl font-black text-emerald-500 hover:text-emerald-600 hover:scale-105 transition-all duration-200 cursor-pointer tracking-wider uppercase"
                style={{
                  fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                  display: 'inline-block',
                  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))'
                }}
                title="Ir al Dashboard"
              >
                NOMADEV.IO
              </button>
            </div>
            
            {/* Navigation Links - Desktop */}
            <nav className="flex items-center space-x-8">
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, '#features')}
                className={`transition-colors font-medium cursor-pointer ${
                  'text-gray-300 hover:text-emerald-400'
                }`}
              >
                Productos
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => scrollToSection(e, '#pricing')}
                className={`transition-colors font-medium cursor-pointer ${
                  'text-gray-300 hover:text-emerald-400'
                }`}
              >
                Precios
              </a>
              <a 
                href="#integrations" 
                onClick={(e) => scrollToSection(e, '#integrations')}
                className={`transition-colors font-medium cursor-pointer ${
                  'text-gray-300 hover:text-emerald-400'
                }`}
              >
                Integraciones
              </a>
              <a 
                href="#customers" 
                onClick={(e) => scrollToSection(e, '#customers')}
                className={`transition-colors font-medium cursor-pointer ${
                  'text-gray-300 hover:text-emerald-400'
                }`}
              >
                Clientes
              </a>
              <a 
                href="#resources" 
                onClick={(e) => scrollToSection(e, '#resources')}
                className={`transition-colors font-medium cursor-pointer ${
                  'text-gray-300 hover:text-emerald-400'
                }`}
              >
                Recursos
              </a>
              <a 
                href="#support" 
                onClick={(e) => scrollToSection(e, '#support')}
                className={`transition-colors font-medium cursor-pointer ${
                  'text-gray-300 hover:text-emerald-400'
                }`}
              >
                Soporte
              </a>
            </nav>
            
            {/* Desktop Actions */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="transition-colors text-gray-300 hover:text-white hover:bg-gray-700">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between relative">
            {/* Mobile Menu Button - Izquierda */}
            <button 
              onClick={toggleMobileMenu}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Logo Centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-3xl font-black text-emerald-500 hover:text-emerald-600 hover:scale-105 transition-all duration-200 cursor-pointer tracking-wider uppercase"
                style={{
                  fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                  display: 'inline-block',
                  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))'
                }}
                title="Ir al Dashboard"
              >
                NOMADEV.IO
              </button>
            </div>

            {/* Espaciador derecho para equilibrar */}
            <div className="w-12"></div>
          </div>
        </div>

        {/* Mobile Menu - Elegante y Profesional */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800/50 bg-black/98 backdrop-blur-xl shadow-2xl">
            <nav className="container mx-auto px-6 py-8 flex flex-col space-y-2">
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, '#features')}
                className="py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between group cursor-pointer text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
              >
                <span className="text-base">Productos</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => scrollToSection(e, '#pricing')}
                className="py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between group cursor-pointer text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
              >
                <span className="text-base">Precios</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a 
                href="#integrations" 
                onClick={(e) => scrollToSection(e, '#integrations')}
                className="py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between group cursor-pointer text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
              >
                <span className="text-base">Integraciones</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a 
                href="#customers" 
                onClick={(e) => scrollToSection(e, '#customers')}
                className="py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between group cursor-pointer text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
              >
                <span className="text-base">Clientes</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a 
                href="#resources" 
                onClick={(e) => scrollToSection(e, '#resources')}
                className="py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between group cursor-pointer text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
              >
                <span className="text-base">Recursos</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a 
                href="#support" 
                onClick={(e) => scrollToSection(e, '#support')}
                className="py-4 px-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-between group cursor-pointer text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
              >
                <span className="text-base">Soporte</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              
              <div className="pt-6 mt-4 border-t border-gray-600/30 flex flex-col space-y-3">
                <Link to="/login">
                  <Button 
                    onClick={toggleMobileMenu}
                    variant="ghost" 
                    className="w-full py-6 text-base font-medium rounded-xl text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    onClick={toggleMobileMenu}
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    Comenzar Gratis
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center bg-black">
        {/* Background decoration - RippleGrid Animation */}
        <div className="absolute inset-0 z-0">
          <RippleGrid
            enableRainbow={false}
            gridColor="#10b981"
            rippleIntensity={0.08}
            gridSize={8}
            gridThickness={12}
            mouseInteraction={true}
            mouseInteractionRadius={1.5}
            opacity={0.6}
            glowIntensity={0.15}
            fadeDistance={1.3}
            vignetteStrength={1.8}
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10 py-20">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-sm">
            Sistema de Validación de Pedidos para Ecommerce
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
            Reduce Devoluciones un 85% con WhatsApp Automático
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-100 font-medium">
            <strong className="text-white">El problema:</strong> Cada devolución te cuesta dinero, tiempo y clientes. <br/>
            <strong className="text-white">La solución:</strong> Valida automáticamente cada pedido por WhatsApp antes del envío.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/interactive-demo">
              <Button size="lg" className="text-lg px-8 py-6 transition-all duration-200 shadow-lg hover:shadow-xl bg-emerald-600 text-white hover:bg-emerald-700 border-0">
                <Play className="mr-2 h-5 w-5" />
                Ver Demo Interactiva
              </Button>
            </Link>
          </div>
          
          {/* Social proof inmediata */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <AvatarGroup max={5} className="rounded-full p-1">
                {AVATARS.map((avatar, index) => (
                  <Avatar key={index} className="border-2 border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 hover:scale-110 w-12 h-12">
                    <AvatarImage 
                      src={avatar.src} 
                      alt={avatar.tooltip}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs w-full h-full flex items-center justify-center">
                      {avatar.fallback}
                    </AvatarFallback>
                    <AvatarGroupTooltip>{avatar.tooltip}</AvatarGroupTooltip>
                  </Avatar>
                ))}
              </AvatarGroup>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-200 font-medium">
                  <strong className="text-white">+500 empresas</strong> ya reducen devoluciones
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-100 font-medium">Setup en 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-100 font-medium">Sin contratos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-100 font-medium">Soporte en español</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Partners/Social Proof Section - Carrusel Automático */}
      <section className="py-12 bg-black backdrop-blur-sm">
        <div className={STYLES.container}>
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wide mb-8">
            Empresas que confían en NOMADEV.IO
          </p>
          
          {/* Swiper Carrusel */}
          <div className="max-w-4xl mx-auto">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 30,
                },
              }}
              className="mySwiper"
            >
              <SwiperSlide>
                <div className="bg-black shadow-lg rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 opacity-70 hover:opacity-100 border border-gray-800">
                  <div className="flex justify-center mb-3">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                      {/* Letra S profesional de Shopify */}
                      <text 
                        x="12" 
                        y="18" 
                        textAnchor="middle" 
                        fontSize="18" 
                        fill="#96BF48" 
                        fontWeight="900" 
                        fontFamily="'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
                        letterSpacing="-0.02em"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                          textRendering: 'optimizeLegibility'
                        }}
                      >
                        S
                      </text>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Shopify</p>
                </div>
              </SwiperSlide>
              
              <SwiperSlide>
                <div className="bg-black shadow-lg rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 opacity-70 hover:opacity-100 border border-gray-800">
                  <div className="flex justify-center mb-3">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#833AB4"/>
                          <stop offset="50%" stopColor="#E1306C"/>
                          <stop offset="100%" stopColor="#FD1D1D"/>
                        </linearGradient>
                      </defs>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient)"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Instagram</p>
                </div>
              </SwiperSlide>
              
              <SwiperSlide>
                <div className="bg-black shadow-lg rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 opacity-70 hover:opacity-100 border border-gray-800">
                  <div className="flex justify-center mb-3">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Google Ads</p>
                </div>
              </SwiperSlide>
              
              <SwiperSlide>
                <div className="bg-black shadow-lg rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 opacity-70 hover:opacity-100 border border-gray-800">
                  <div className="flex justify-center mb-3">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="#4285F4"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Google Calendar</p>
                </div>
              </SwiperSlide>
              
              <SwiperSlide>
                <div className="bg-black shadow-lg rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 opacity-70 hover:opacity-100 border border-gray-800">
                  <div className="flex justify-center mb-3">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#25D366"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>

      {/* How it Works - Diseño Futurista */}
      <section className="py-20 bg-black relative overflow-hidden">
        {/* Elementos de fondo futuristas */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-emerald-400 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-violet-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 shadow-sm">
              Proceso Simple
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Cómo funciona? Solo 3 pasos
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Empieza a automatizar tus ventas en menos de 5 minutos
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
              {/* Paso 1 */}
              <div className="relative text-center group">
                <div className="relative">
                  {/* Efecto de resplandor */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 mx-auto"></div>
                  
                  {/* Icono principal */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-cyan-500/50 group-hover:scale-110 transition-all duration-500 border-2 border-white/20">
                    <span className="text-3xl font-bold text-white drop-shadow-lg">1</span>
                    
                    {/* Efecto de partículas */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">Conecta tu Tienda</h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Integra tu tienda Shopify con un solo clic. Sin código, sin complicaciones.
                </p>
              </div>

              {/* Paso 2 */}
              <div className="relative text-center group">
                <div className="relative">
                  {/* Efecto de resplandor */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 mx-auto"></div>
                  
                  {/* Icono principal */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all duration-500 border-2 border-white/20">
                    <span className="text-3xl font-bold text-white drop-shadow-lg">2</span>
                    
                    {/* Efecto de partículas */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-teal-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">Personaliza Mensajes</h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Crea plantillas de WhatsApp personalizadas para cada tipo de pedido.
                </p>
              </div>

              {/* Paso 3 */}
              <div className="relative text-center group">
                <div className="relative">
                  {/* Efecto de resplandor */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 mx-auto"></div>
                  
                  {/* Icono principal */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-violet-500/50 group-hover:scale-110 transition-all duration-500 border-2 border-white/20">
                    <span className="text-3xl font-bold text-white drop-shadow-lg">3</span>
                    
                    {/* Efecto de partículas */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-violet-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors duration-300">¡Listo! Automatiza</h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Deja que NOMADEV.IO valide cada pedido automáticamente. Tú solo relájate.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Benefits Section (Reformulado para enfocarse en BENEFICIOS no características) */}
      <section id="features" className="container mx-auto px-4 py-20 bg-black">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
            Beneficios Reales
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Por qué las empresas nos eligen
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            No vendemos características, resolvemos problemas reales de tu negocio
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {/* Beneficio 1 - Enfocado en AHORRO DE TIEMPO */}
          <div className="group relative bg-black border border-white/10 rounded-2xl p-8 hover:bg-black hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors duration-300">
                Ahorra 20+ Horas Semanales
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Olvídate de confirmar pedidos manualmente. Deja que la automatización trabaje por ti 24/7.
              </p>
            </div>
          </div>

          {/* Beneficio 2 - Enfocado en REDUCIR DEVOLUCIONES */}
          <div className="group relative bg-black border border-white/10 rounded-2xl p-8 hover:bg-black hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                Reduce Devoluciones un 85%
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Valida cada pedido antes del envío. Confirma dirección, talla y color directamente con tu cliente.
              </p>
            </div>
          </div>

          {/* Beneficio 3 - Enfocado en AUMENTAR VENTAS */}
          <div className="group relative bg-black border border-white/10 rounded-2xl p-8 hover:bg-black hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-violet-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-violet-500/25">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-violet-400 transition-colors duration-300">
                Aumenta Conversiones 3x
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Los clientes que reciben confirmación por WhatsApp completan el 300% más pedidos.
              </p>
            </div>
          </div>

          {/* Beneficio 4 - Enfocado en EXPERIENCIA DEL CLIENTE */}
          <div className="group relative bg-black border border-white/10 rounded-2xl p-8 hover:bg-black hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/25">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-amber-400 transition-colors duration-300">
                Clientas Más Satisfechos
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Respuesta instantánea = clientes felices. Mejora tus reseñas y aumenta la lealtad.
              </p>
            </div>
          </div>

          {/* Beneficio 5 - Enfocado en DECISIONES INTELIGENTES */}
          <div className="group relative bg-black border border-white/10 rounded-2xl p-8 hover:bg-black hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-rose-500/25">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-rose-400 transition-colors duration-300">
                Decisiones Basadas en Datos
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Ve exactamente qué funciona. Optimiza tus mensajes y aumenta tu ROI continuamente.
              </p>
            </div>
          </div>

          {/* Beneficio 6 - Enfocado en CONFIGURACIÓN SIMPLE */}
          <div className="group relative bg-black border border-white/10 rounded-2xl p-8 hover:bg-black hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors duration-300">
                Sin Conocimientos Técnicos
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Todo en español, intuitivo y fácil. Si usas Shopify, puedes usar NOMADEV.IO.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials Section - Dual Marquee Animation */}
      <section id="customers" className="py-20 bg-black relative overflow-hidden">
        <div className={STYLES.container}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Empresas exitosas que han transformado sus ventas con NOMADEV.IO
            </p>
          </div>
          
          {/* Dual Marquee Container */}
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            {/* Primera fila - Movimiento hacia la derecha */}
            <Marquee pauseOnHover className="[--duration:18s] mb-4" style={{'--duration': '18s', willChange: 'transform'} as React.CSSProperties}>
              {firstRow.map((testimonial) => (
                <ReviewCard 
                  key={testimonial.id}
                  img={testimonial.img}
                  name={testimonial.name}
                  role={testimonial.role}
                  quote={testimonial.quote}
                  gradient={testimonial.gradient}
                  quoteColor={testimonial.quoteColor}
                />
              ))}
            </Marquee>
            
            {/* Segunda fila - Movimiento hacia la izquierda */}
            <Marquee reverse pauseOnHover className="[--duration:18s]" style={{'--duration': '18s', willChange: 'transform'} as React.CSSProperties}>
              {secondRow.map((testimonial) => (
                <ReviewCard 
                  key={testimonial.id}
                  img={testimonial.img}
                  name={testimonial.name}
                  role={testimonial.role}
                  quote={testimonial.quote}
                  gradient={testimonial.gradient}
                  quoteColor={testimonial.quoteColor}
                />
              ))}
            </Marquee>
            
            {/* Gradient overlays for smooth edges */}
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black to-transparent pointer-events-none z-10"></div>
            <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black to-transparent pointer-events-none z-10"></div>
          </div>
        </div>
      </section>




      {/* Global Reach Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">
                  Alcance Global
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Conecta con clientes en todo el mundo. Nuestras herramientas de automatización 
                  te permiten gestionar tu negocio desde cualquier lugar del planeta.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Automatización 24/7</h3>
                    <p className="text-gray-300">Tu negocio funciona sin parar, sin importar la zona horaria</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Integración Multi-plataforma</h3>
                    <p className="text-gray-300">Conecta todas tus herramientas en un solo lugar</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Escalabilidad Global</h3>
                    <p className="text-gray-300">Crece sin límites, desde cualquier parte del mundo</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Globe */}
            <div className="relative">
              <div className="relative w-full h-[500px] lg:h-[600px]">
                <Globe 
                  className="w-full h-full"
                  config={GLOBE_CONFIG as any}
                />
                
                {/* Overlay with stats */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-emerald-400 mb-2">50+</div>
                    <div className="text-xl text-white">Países Conectados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section - Moved after globe */}
      <section id="integrations" className="py-20 bg-black">
        <div className={STYLES.container}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Integraciones que Funcionan
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Conecta con las herramientas que ya usas
            </p>
          </div>
          
          {/* Integrations Marquee - Scroll Infinito Horizontal */}
          <div className="relative overflow-hidden">
            <Marquee pauseOnHover className="[--duration:35s]" style={{'--duration': '35s', willChange: 'transform'} as React.CSSProperties}>
              {/* Primera fila - Movimiento hacia la derecha */}
              <div className="flex items-center space-x-20 mr-20">
                {/* Shopify */}
                <div className="flex flex-col items-center group">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                    <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.337 23.979c-.35 0-.665-.133-.905-.365l-6.337-5.8-1.227 1.148a1.24 1.24 0 0 1-1.7 0 1.24 1.24 0 0 1 0-1.7l2.127-1.99-6.337-5.8a1.24 1.24 0 0 1 0-1.7 1.24 1.24 0 0 1 1.7 0l6.337 5.8 1.227-1.148a1.24 1.24 0 0 1 1.7 0 1.24 1.24 0 0 1 0 1.7l-2.127 1.99 6.337 5.8a1.24 1.24 0 0 1 0 1.7c-.24.232-.555.365-.905.365z"/>
                    </svg>
                  </div>
                  <span className="text-base font-medium text-white mt-3">Shopify</span>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col items-center group">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 group-hover:scale-110 transition-all duration-300">
                    <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <span className="text-base font-medium text-white mt-3">WhatsApp</span>
                </div>

                {/* Google Analytics */}
                <div className="flex flex-col items-center group">
                  <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-white/25 group-hover:scale-110 transition-all duration-300">
                    <svg className="h-16 w-16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <span className="text-base font-medium text-white mt-3">Google</span>
                </div>

                {/* Instagram */}
                <div className="flex flex-col items-center group">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-pink-500/25 group-hover:scale-110 transition-all duration-300">
                    <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span className="text-base font-medium text-white mt-3">Instagram</span>
                </div>

                {/* Facebook */}
                <div className="flex flex-col items-center group">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-110 transition-all duration-300">
                    <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-base font-medium text-white mt-3">Facebook</span>
                </div>

                {/* TikTok */}
                <div className="flex flex-col items-center group">
                  <div className="w-32 h-32 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-gray-500/25 group-hover:scale-110 transition-all duration-300">
                    <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                  </div>
                  <span className="text-base font-medium text-white mt-3">TikTok</span>
                </div>
              </div>
            </Marquee>
          </div>
        </div>
      </section>

      {/* Video & Contact Form Section */}
      <section className={STYLES.section}>
        <div className={STYLES.container}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ve NOMADEV.IO en Acción
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Descubre cómo funciona nuestro sistema y solicita una demostración personalizada
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Video Section - HeroVideoDialog */}
            <div className="space-y-6">
              <HeroVideoDialog
                className="w-full"
                animationStyle="from-center"
                videoSrc="https://www.example.com/dummy-video"
                thumbnailSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&crop=center"
                thumbnailAlt="NOMADEV.IO Demo Video"
              />
            </div>

            {/* Contact Form Section */}
            <div className="space-y-6">
              <Card className="shadow-2xl border-0 bg-black backdrop-blur-sm relative overflow-hidden border border-gray-800">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <CardHeader className="text-center relative z-10">
                  <CardTitle className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    Bienvenido 👋
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    Estás a pocos pasos de conocer cómo NOMADEV.IO puede ayudarte a mejorar tu negocio de ecommerce. 
                    Rellena el siguiente formulario y tu demo será agendada:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 relative z-10">
                  <form className="space-y-6">
                    <div className="space-y-6">
                      {/* Nombre */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-white placeholder-gray-500"
                          placeholder="Juan Pérez"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-white placeholder-gray-500"
                          placeholder="juan@empresa.com"
                        />
                      </div>

                      {/* Empresa */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Empresa
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-white placeholder-gray-500"
                          placeholder="Mi Tienda Online"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Número de WhatsApp
                        </label>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-white placeholder-gray-500"
                          placeholder="+56948576839"
                        />
                      </div>
                    </div>
                    
                    {/* Botón de envío */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        Solicitar Demo
                      </Button>
                    </div>
                  </form>
                  
                  <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-600/50">
                    <p>Al enviar este formulario, aceptas nuestros términos de servicio y política de privacidad.</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Trust indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-black/80 rounded-lg backdrop-blur-sm border border-gray-800">
                  <div className="text-lg font-bold text-emerald-600 mb-1">24h</div>
                  <div className="text-sm text-gray-300">Respuesta garantizada</div>
                </div>
                <div className="text-center p-4 bg-black/80 rounded-lg backdrop-blur-sm border border-gray-800">
                  <div className="text-lg font-bold text-emerald-600 mb-1">100%</div>
                  <div className="text-sm text-gray-300">Gratis y sin compromiso</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Professional Corporate Design */}
      <section id="pricing" className="py-24 bg-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-cyan-400 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-violet-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className={`${STYLES.container} relative z-10`}>
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30">
              Planes Empresariales
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Soluciones que Escalan
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Desde startups hasta corporaciones, tenemos el plan perfecto para automatizar 
              y optimizar tu negocio de e-commerce
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Starter Plan */}
            <div className="group relative bg-black border border-white/10 rounded-3xl p-10 hover:bg-black hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-emerald-500/10">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Plan Badge */}
              <div className="absolute -top-3 left-8">
                <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-full px-4 py-1">
                  <span className="text-sm font-medium text-gray-300">BÁSICO</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Starter</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Ideal para emprendedores y pequeñas empresas
                  </p>
                </div>
                
                {/* Pricing */}
                <div className="text-center mb-10">
                  <div className="flex items-baseline justify-center">
                    <span className="text-6xl font-bold text-white">$49</span>
                    <span className="text-xl text-gray-400 ml-2">/mes</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Facturación mensual</p>
                </div>
                
                {/* Features */}
                <div className="space-y-5 mb-10">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Hasta 1,000 mensajes WhatsApp/mes</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">1 tienda Shopify conectada</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Soporte técnico por email</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Dashboard básico de analytics</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Setup guiado en 5 minutos</span>
                  </div>
                </div>
                
                {/* CTA */}
                <Button className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 py-4 text-lg font-semibold rounded-xl">
                  Comenzar Gratis
                </Button>
              </div>
            </div>
            
            {/* Professional Plan - Featured */}
            <div className="group relative bg-black border-2 border-emerald-500/50 rounded-3xl p-10 hover:bg-black hover:border-emerald-400 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-emerald-500/20 scale-105">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 shadow-xl text-sm font-semibold">
                  MÁS POPULAR
                </Badge>
              </div>
              
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent rounded-3xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Professional</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Para negocios en crecimiento y equipos medianos
                  </p>
                </div>
                
                {/* Pricing */}
                <div className="text-center mb-10">
                  <div className="flex items-baseline justify-center">
                    <span className="text-6xl font-bold text-white">$99</span>
                    <span className="text-xl text-gray-400 ml-2">/mes</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Facturación mensual</p>
                </div>
                
                {/* Features */}
                <div className="space-y-5 mb-10">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Hasta 5,000 mensajes WhatsApp/mes</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Hasta 5 tiendas Shopify</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Soporte prioritario 24/7</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Analytics avanzados y reportes</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Automatizaciones personalizadas</span>
                  </div>
                </div>
                
                {/* CTA */}
                <Button className="w-full bg-white hover:bg-gray-100 text-black font-bold transition-all duration-300 py-4 text-lg rounded-xl shadow-xl">
                  Comenzar Prueba
                </Button>
              </div>
            </div>
            
            {/* Enterprise Plan */}
            <div className="group relative bg-black border border-white/10 rounded-3xl p-10 hover:bg-black hover:border-violet-500/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-violet-500/10">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Plan Badge */}
              <div className="absolute -top-3 left-8">
                <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-full px-4 py-1">
                  <span className="text-sm font-medium text-gray-300">ENTERPRISE</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Enterprise</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Para grandes corporaciones y equipos globales
                  </p>
                </div>
                
                {/* Pricing */}
                <div className="text-center mb-10">
                  <div className="flex items-baseline justify-center">
                    <span className="text-6xl font-bold text-white">$189</span>
                    <span className="text-xl text-gray-400 ml-2">/mes</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Facturación mensual</p>
                </div>
                
                {/* Features */}
                <div className="space-y-5 mb-10">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Mensajes WhatsApp ilimitados</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Tiendas Shopify ilimitadas</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Soporte 24/7 con gerente dedicado</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">API personalizada y webhooks</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">Integraciones personalizadas</span>
                  </div>
                </div>
                
                {/* CTA */}
                <Button className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300 py-4 text-lg font-semibold rounded-xl">
                  Contactar Ventas
                </Button>
              </div>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-400 mb-6">¿Necesitas un plan personalizado?</p>
            <Button variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/70 transition-all duration-300 px-8 py-3">
              Hablar con un Experto
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section - Moved after video and form */}
      <section className={STYLES.section}>
        <div className={STYLES.container}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Resolvemos las dudas más comunes sobre NOMADEV.IO
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all duration-300 border border-gray-800">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-800/50 transition-colors duration-200"
                  onClick={() => toggleFAQ(0)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>¿Cómo funciona la integración con Shopify?</span>
                    <ChevronDown 
                      className={`h-5 w-5 text-emerald-500 transition-transform duration-200 ${
                        openFAQ === 0 ? 'rotate-180' : ''
                      }`} 
                    />
                  </CardTitle>
                </CardHeader>
                {openFAQ === 0 && (
                  <CardContent>
                    <p className="text-gray-300">
                      La integración es súper simple. Solo necesitas conectar tu tienda Shopify con NOMADEV.IO 
                      en menos de 2 minutos. Una vez conectada, automáticamente sincronizamos todos tus pedidos, 
                      clientes y productos.
                    </p>
                  </CardContent>
                )}
              </Card>
              
              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all duration-300 border border-gray-800">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-800/50 transition-colors duration-200"
                  onClick={() => toggleFAQ(1)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>¿Puedo personalizar los mensajes de WhatsApp?</span>
                    <ChevronDown 
                      className={`h-5 w-5 text-emerald-500 transition-transform duration-200 ${
                        openFAQ === 1 ? 'rotate-180' : ''
                      }`} 
                    />
                  </CardTitle>
                </CardHeader>
                {openFAQ === 1 && (
                  <CardContent>
                    <p className="text-gray-300">
                      ¡Absolutamente! Puedes personalizar completamente los mensajes, agregar variables dinámicas 
                      como el nombre del cliente, número de pedido, productos comprados, y mucho más. 
                      También puedes crear diferentes plantillas para diferentes tipos de pedidos.
                    </p>
                  </CardContent>
                )}
              </Card>
              
              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all duration-300 border border-gray-800">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-800/50 transition-colors duration-200"
                  onClick={() => toggleFAQ(2)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>¿Qué pasa si supero el límite de mensajes?</span>
                    <ChevronDown 
                      className={`h-5 w-5 text-emerald-500 transition-transform duration-200 ${
                        openFAQ === 2 ? 'rotate-180' : ''
                      }`} 
                    />
                  </CardTitle>
                </CardHeader>
                {openFAQ === 2 && (
                  <CardContent>
                    <p className="text-gray-300">
                      No te preocupes, nunca te cortaremos el servicio. Si superas tu límite mensual, 
                      te notificaremos y podrás actualizar tu plan o comprar mensajes adicionales. 
                      Los mensajes adicionales tienen un costo muy competitivo.
                    </p>
                  </CardContent>
                )}
              </Card>
              
              <Card className="border-0 shadow-lg bg-black hover:shadow-xl transition-all duration-300 border border-gray-800">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-800/50 transition-colors duration-200"
                  onClick={() => toggleFAQ(3)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>¿Ofrecen soporte técnico?</span>
                    <ChevronDown 
                      className={`h-5 w-5 text-emerald-500 transition-transform duration-200 ${
                        openFAQ === 3 ? 'rotate-180' : ''
                      }`} 
                    />
                  </CardTitle>
                </CardHeader>
                {openFAQ === 3 && (
                  <CardContent>
                    <p className="text-gray-300">
                      Sí, ofrecemos soporte técnico completo. Los usuarios del plan Starter tienen soporte por email, 
                      los usuarios Pro tienen soporte prioritario, y los usuarios Enterprise tienen soporte 24/7 
                      con un gerente de cuenta dedicado.
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - MEJORADO */}
      <section className="py-24 bg-black relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30">
              🚀 Última Oportunidad
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              ¿Listo para Reducir tus Devoluciones un 85%?
            </h2>
            <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Únete a más de <strong>500 empresas exitosas</strong> que ya usan NOMADEV.IO para validar pedidos automáticamente. 
              Sin tarjeta de crédito. Sin contratos. Empieza gratis en 5 minutos.
            </p>
            
            {/* CTAs principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/register">
                <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 text-lg px-12 py-7 shadow-2xl hover:shadow-emerald-500/20 transform hover:scale-105 transition-all duration-300 font-bold">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link to="/interactive-demo">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-emerald-500 text-emerald-300 hover:bg-emerald-500/10 text-lg px-12 py-7 shadow-xl">
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demo Interactiva
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Cancela cuando quieras</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Setup en 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Soporte en español 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="resources" className="bg-black text-white py-16">
        <div className={STYLES.container}>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <span className="text-2xl font-bold text-white">NOMADEV.IO</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                La plataforma más completa para automatizar tu negocio de e-commerce. 
                Conecta Shopify con WhatsApp y revoluciona tus ventas.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Producto</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div id="support">
              <h3 className="text-lg font-semibold mb-4">Soporte</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Comunidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Estado del Sistema</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 NOMADEV.IO. Todos los derechos reservados.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </CustomCursor>
  );
});

LandingPage.displayName = 'LandingPage';

export default LandingPage;
