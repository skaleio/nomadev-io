import { lazy, Suspense } from "react";
import { HeroUIProvider } from "@heroui/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ThemeProvider } from "@/theme/ThemeContext";
import { NotificationsProvider } from "@/features/notifications/context/NotificationsContext";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

// MVP — carga inmediata (auth + dashboard + CRM + pedidos Dropi + ajustes)
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { EmailVerificationPage } from "@/features/auth/pages/EmailVerificationPage";
import AuthSuccessPage from "@/features/auth/pages/AuthSuccessPage";
import OnboardingPage from "@/features/onboarding/pages/OnboardingPage";
import OrdersPage from "@/features/orders/pages/OrdersPage";
import CRMPage from "@/features/crm/pages/CRMPage";
import DropiPage from "@/features/dropi/pages/DropiPage";
import DropiConnectPage from "@/features/dropi/pages/DropiConnectPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import SubscribePage from "@/pages/SubscribePage";

// Post-MVP — lazy
const WorkflowExamplePage = lazy(() =>
  import("@/features/workflow/components/WorkflowExample").then((m) => ({ default: m.WorkflowExample })),
);
const ValidationPage = lazy(() => import("@/features/orders/pages/ValidationPage"));
const ChatPage = lazy(() => import("@/features/chat/pages/ChatPage"));
const LeadsPage = lazy(() => import("@/features/crm/pages/LeadsPage"));
const ShopifyPage = lazy(() => import("@/features/shopify/pages/ShopifyPage"));
const ShopifyConnectPage = lazy(() => import("@/features/shopify/pages/ShopifyConnectPage"));
const BillingPage = lazy(() => import("@/features/billing/pages/BillingPage"));
const KeyboardShortcutsPage = lazy(() => import("@/pages/KeyboardShortcutsPage"));
const TeamIndexPage = lazy(() => import("@/features/team/pages/TeamIndexPage"));
const TeamNewPage = lazy(() => import("@/features/team/pages/TeamNewPage"));
const TeamInvitePage = lazy(() => import("@/features/team/pages/TeamInvitePage"));
const OrderValidationPage = lazy(() => import("@/features/orders/pages/OrderValidationPage"));
const TrackingPage = lazy(() => import("@/features/orders/pages/TrackingPage"));
const StudioIAPage = lazy(() => import("@/features/studio-ia/pages/StudioIAPage"));
const ProductImageGeneratorPage = lazy(() => import("@/features/studio-ia/pages/ProductImageGeneratorPage"));
const CopywritingPage = lazy(() => import("@/features/studio-ia/pages/CopywritingPage"));
const LogoGeneratorPage = lazy(() => import("@/features/studio-ia/pages/LogoGeneratorPage"));
const AgentBuilderPage = lazy(() => import("@/features/workflow/pages/AgentBuilderPage"));
const AgentHubPage = lazy(() => import("@/features/agents/pages/AgentHubPage"));
const WhatsAppIntegrationPage = lazy(() => import("@/features/whatsapp/pages/WhatsAppIntegrationPage"));
const PriceOptimizerPage = lazy(() => import("@/features/studio-ia/pages/PriceOptimizerPage"));
const BrandIdentityPage = lazy(() => import("@/features/studio-ia/pages/BrandIdentityPage"));
const WebsiteBuilderPage = lazy(() => import("@/features/studio-ia/pages/WebsiteBuilderPage"));

// Demos — lazy (mocks internos)
const DemoPage = lazy(() => import("@/pages/demo/DemoPage"));
const InteractiveDemo = lazy(() => import("@/pages/demo/InteractiveDemo"));
const ValidationDemo = lazy(() => import("@/pages/demo/ValidationDemo"));
const ShopifyDemo = lazy(() => import("@/pages/demo/ShopifyDemo"));
const ChatDemo = lazy(() => import("@/pages/demo/ChatDemo"));
const OrdersDemo = lazy(() => import("@/pages/demo/OrdersDemo"));
const OrderValidationDemo = lazy(() => import("@/pages/demo/OrderValidationDemo"));
const TrackingDemo = lazy(() => import("@/pages/demo/TrackingDemo"));
const LeadsDemo = lazy(() => import("@/pages/demo/LeadsDemo"));
const SettingsDemo = lazy(() => import("@/pages/demo/SettingsDemo"));
const StudioIADemo = lazy(() => import("@/pages/demo/StudioIADemo"));
const CRMDemo = lazy(() => import("@/pages/demo/CRMDemo"));
const ScheduleDemoPage = lazy(() => import("@/pages/demo/ScheduleDemoPage"));

const queryClient = new QueryClient();

// AppContent NO bloquea por isLoading: las rutas públicas renderizan al instante
// y ProtectedRoute muestra su propio loader solo cuando hace falta.
const AppContent = () => {
  return (
    <>
      <Sonner />

      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/suscribirse" element={<SubscribePage />} />
              <Route path="/workflow" element={<WorkflowExamplePage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/interactive-demo" element={<InteractiveDemo />} />
              <Route path="/validation-demo" element={<ValidationDemo />} />
              <Route path="/shopify-demo" element={<ShopifyDemo />} />
              <Route path="/chat-demo" element={<ChatDemo />} />
              <Route path="/orders-demo" element={<OrdersDemo />} />
              <Route path="/order-validation-demo" element={<OrderValidationDemo />} />
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
