import { lazy, Suspense } from "react";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import ProtectedRoute from "./components/ProtectedRoute";

// MVP — carga inmediata (auth + dashboard + CRM + pedidos Dropi + ajustes)
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import AuthSuccessPage from "./pages/AuthSuccessPage";
import OnboardingPage from "./pages/OnboardingPage";
import OrdersPage from "./pages/OrdersPage";
import CRMPage from "./pages/CRMPage";
import DropiPage from "./pages/DropiPage";
import DropiConnectPage from "./pages/DropiConnectPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// Post-MVP — lazy
const WorkflowExample = lazy(() =>
  import("./components/workflow/WorkflowExample").then((m) => ({ default: m.WorkflowExample })),
);
const ValidationPage = lazy(() => import("./pages/ValidationPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const ShopifyPage = lazy(() => import("./pages/ShopifyPage"));
const ShopifyConnectPage = lazy(() => import("./pages/ShopifyConnectPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const KeyboardShortcutsPage = lazy(() => import("./pages/KeyboardShortcutsPage"));
const TeamIndexPage = lazy(() => import("./pages/TeamIndexPage"));
const TeamNewPage = lazy(() => import("./pages/TeamNewPage"));
const TeamInvitePage = lazy(() => import("./pages/TeamInvitePage"));
const OrderValidationPage = lazy(() => import("./pages/OrderValidationPage"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const StudioIAPage = lazy(() => import("./pages/StudioIAPage"));
const ProductImageGeneratorPage = lazy(() => import("./pages/ProductImageGeneratorPage"));
const CopywritingPage = lazy(() => import("./pages/CopywritingPage"));
const LogoGeneratorPage = lazy(() => import("./pages/LogoGeneratorPage"));
const AgentBuilderPage = lazy(() => import("./pages/AgentBuilderPage"));
const AgentHubPage = lazy(() => import("./pages/AgentHubPage"));
const WhatsAppIntegrationPage = lazy(() => import("./pages/WhatsAppIntegrationPage"));
const PriceOptimizerPage = lazy(() => import("./pages/PriceOptimizerPage"));
const BrandIdentityPage = lazy(() => import("./pages/BrandIdentityPage"));
const WebsiteBuilderPage = lazy(() => import("./pages/WebsiteBuilderPage"));

// Demos — lazy (mocks internos)
const DemoPage = lazy(() => import("./pages/DemoPage"));
const InteractiveDemo = lazy(() => import("./pages/InteractiveDemo"));
const ValidationDemo = lazy(() => import("./pages/ValidationDemo"));
const ShopifyDemo = lazy(() => import("./pages/ShopifyDemo"));
const ChatDemo = lazy(() => import("./pages/ChatDemo"));
const OrdersDemo = lazy(() => import("./pages/OrdersDemo"));
const TrackingDemo = lazy(() => import("./pages/TrackingDemo"));
const LeadsDemo = lazy(() => import("./pages/LeadsDemo"));
const SettingsDemo = lazy(() => import("./pages/SettingsDemo"));
const StudioIADemo = lazy(() => import("./pages/StudioIADemo"));
const CRMDemo = lazy(() => import("./pages/CRMDemo"));
const ScheduleDemoPage = lazy(() => import("./pages/ScheduleDemoPage"));

const queryClient = new QueryClient();

// AppContent NO bloquea por isLoading: las rutas públicas renderizan al instante
// y ProtectedRoute muestra su propio loader solo cuando hace falta.
const AppContent = () => {
  return (
    <>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
                       <Route path="/dropi" element={<ProtectedRoute><DropiPage /></ProtectedRoute>} />
                       <Route path="/dropi/connect" element={<ProtectedRoute><DropiConnectPage /></ProtectedRoute>} />
                       <Route path="/whatsapp-integration" element={<ProtectedRoute><WhatsAppIntegrationPage /></ProtectedRoute>} />
                       <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                       <Route path="/order-validation" element={<ProtectedRoute><OrderValidationPage /></ProtectedRoute>} />
                       <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
                       <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
                       <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />
                       <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                       <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                       <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                       <Route path="/keyboard-shortcuts" element={<ProtectedRoute><KeyboardShortcutsPage /></ProtectedRoute>} />
                       <Route path="/team" element={<ProtectedRoute><TeamIndexPage /></ProtectedRoute>} />
                       <Route path="/team/new" element={<ProtectedRoute><TeamNewPage /></ProtectedRoute>} />
                       <Route path="/team/invite/:channel" element={<ProtectedRoute><TeamInvitePage /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <HeroUIProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <CustomCursor>
                <AppContent />
              </CustomCursor>
            </TooltipProvider>
          </WebSocketProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HeroUIProvider>
);

export default App;
