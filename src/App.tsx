import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { EvolutionProvider } from "./contexts/EvolutionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { LoadingScreen } from "./components/ui/loading-logo";
// import { SimpleCommandPalette } from "./components/ui/simple-command-palette";
// import { useSimpleCommandPalette } from "./hooks/useSimpleCommandPalette";
// import { setupApiInterceptors } from "./lib/api"; // Removed - no longer needed
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import { WorkflowExample } from "./components/workflow/WorkflowExample";
import RegisterPage from "./pages/RegisterPage";
import ValidationPage from "./pages/ValidationPage";
import ChatPage from "./pages/ChatPage";
import LeadsPage from "./pages/LeadsPage";
import ShopifyPage from "./pages/ShopifyPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ShopifyConnectPage from "./pages/ShopifyConnectPage";
import AuthSuccessPage from "./pages/AuthSuccessPage";
import OrderValidationPage from "./pages/OrderValidationPage";
import OrdersPage from "./pages/OrdersPage";
import TrackingPage from "./pages/TrackingPage";
import CRMPage from "./pages/CRMPage";
import StudioIAPage from "./pages/StudioIAPage";
import ProductImageGeneratorPage from "./pages/ProductImageGeneratorPage";
import CopywritingPage from "./pages/CopywritingPage";
import LogoGeneratorPage from "./pages/LogoGeneratorPage";
import AgentBuilderPage from "./pages/AgentBuilderPage";
import AgentHubPage from "./pages/AgentHubPage";
import WhatsAppIntegrationPage from "./pages/WhatsAppIntegrationPage";
import PriceOptimizerPage from "./pages/PriceOptimizerPage";
import BrandIdentityPage from "./pages/BrandIdentityPage";
import WebsiteBuilderPage from "./pages/WebsiteBuilderPage";
import DemoPage from "./pages/DemoPage";
import InteractiveDemo from "./pages/InteractiveDemo";
import ValidationDemo from "./pages/ValidationDemo";
import ShopifyDemo from "./pages/ShopifyDemo";
import ChatDemo from "./pages/ChatDemo";
import OrdersDemo from "./pages/OrdersDemo";
import TrackingDemo from "./pages/TrackingDemo";
import LeadsDemo from "./pages/LeadsDemo";
import SettingsDemo from "./pages/SettingsDemo";
import StudioIADemo from "./pages/StudioIADemo";
import CRMDemo from "./pages/CRMDemo";
import ScheduleDemoPage from "./pages/ScheduleDemoPage";
import OnboardingPage from "./pages/OnboardingPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Configuración de API manejada por Supabase directamente

// Componente interno que muestra loading mientras Auth carga
const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Cargando aplicación..." />;
  }

  return (
    <>
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/workflow" element={<WorkflowExample />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/interactive-demo" element={<InteractiveDemo />} />
              <Route path="/validation-demo" element={<ValidationDemo />} />
              <Route path="/shopify-demo" element={<ShopifyDemo />} />
              <Route path="/chat-demo" element={<ChatDemo />} />
              <Route path="/orders-demo" element={<OrdersDemo />} />
              <Route path="/tracking-demo" element={<TrackingDemo />} />
              <Route path="/leads-demo" element={<LeadsDemo />} />
              <Route path="/settings-demo" element={<SettingsDemo />} />
              <Route path="/studio-ia-demo" element={<StudioIADemo />} />
              <Route path="/crm-demo" element={<CRMDemo />} />
              <Route path="/schedule-demo" element={<ScheduleDemoPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              
              {/* Onboarding */}
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
              
              {/* Rutas protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/validation" element={<ProtectedRoute><ValidationPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                       <Route path="/shopify" element={<ProtectedRoute><ShopifyPage /></ProtectedRoute>} />
                       <Route path="/studio-ia" element={<ProtectedRoute><StudioIAPage /></ProtectedRoute>} />
                       <Route path="/product-image-generator" element={<ProtectedRoute><ProductImageGeneratorPage /></ProtectedRoute>} />
                       <Route path="/copywriting" element={<ProtectedRoute><CopywritingPage /></ProtectedRoute>} />
                       <Route path="/logo-generator" element={<ProtectedRoute><LogoGeneratorPage /></ProtectedRoute>} />
                       <Route path="/agents" element={<ProtectedRoute><AgentHubPage /></ProtectedRoute>} />
                       <Route path="/agent-builder" element={<ProtectedRoute><AgentBuilderPage /></ProtectedRoute>} />
                       <Route path="/price-optimizer" element={<ProtectedRoute><PriceOptimizerPage /></ProtectedRoute>} />
                       <Route path="/brand-identity" element={<ProtectedRoute><BrandIdentityPage /></ProtectedRoute>} />
                       <Route path="/website-builder" element={<ProtectedRoute><WebsiteBuilderPage /></ProtectedRoute>} />
                       <Route path="/shopify/connect" element={<ProtectedRoute><ShopifyConnectPage /></ProtectedRoute>} />
                       <Route path="/whatsapp-integration" element={<ProtectedRoute><WhatsAppIntegrationPage /></ProtectedRoute>} />
                       <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                       <Route path="/order-validation" element={<ProtectedRoute><OrderValidationPage /></ProtectedRoute>} />
                       <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
                       <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
                       <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />
                       <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                       <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <WebSocketProvider>
            <EvolutionProvider>
              <TooltipProvider>
                <CustomCursor>
                  <AppContent />
                </CustomCursor>
              </TooltipProvider>
            </EvolutionProvider>
          </WebSocketProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
