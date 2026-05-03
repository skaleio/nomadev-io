import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock } from 'lucide-react';
import { STARTER_SUBSCRIPTION_CHECKOUT_URL } from '@/lib/landing-pricing';

const CONTAINER = 'container mx-auto px-4';

export interface LandingPricingPlansProps {
  /** Si se define (p. ej. `"pricing"`), la sección tiene `id` para anchors en la home. */
  sectionId?: string;
}

export function LandingPricingPlans({ sectionId }: LandingPricingPlansProps) {
  return (
    <section
      id={sectionId}
      className="py-24 bg-black relative overflow-hidden text-white"
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-cyan-400 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-violet-400 rounded-full blur-3xl" />
      </div>

      <div className={`${CONTAINER} relative z-10`}>
        <div className="text-center mb-20">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30">
            Planes Empresariales
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Soluciones que Escalan
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Desde startups hasta corporaciones, tenemos el plan perfecto para automatizar y optimizar tu negocio de
            e-commerce
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="group relative bg-black border border-white/10 rounded-3xl p-10 hover:bg-black hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute -top-3 left-8">
              <div className="bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/35 rounded-full px-4 py-1">
                <span className="text-sm font-medium text-emerald-200">Disponible</span>
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Starter</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Incluye la misma <span className="text-emerald-300/90">Gestión de pedidos</span> que usamos en
                  producción: importación por guía y tienda en vivo.
                </p>
              </div>

              <div className="text-center mb-10">
                <div className="flex items-baseline justify-center flex-wrap gap-x-1">
                  <span className="text-5xl sm:text-6xl font-bold text-white">$25.000</span>
                  <span className="text-xl text-gray-400">CLP</span>
                  <span className="text-xl text-gray-400 ml-1">/mes</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Pesos chilenos · facturación mensual</p>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    <strong className="text-white">Importación</strong>: subí tu guía/planilla (Excel) y operamos
                    todos los pedidos en un solo panel, con historial de importaciones.
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    <strong className="text-white">Métricas desde la guía</strong>: totales por estado, ventas y
                    pedidos por región, días a entrega, utilidad y tendencia diaria, ROAS de campañas Meta, envíos por
                    transportista e insights por producto.
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    <strong className="text-white">Tienda en vivo (Shopify)</strong>: sincronización de pedidos con
                    tarjetas de Total, Pendientes de validación, Validados y Rechazados; actualización y detalle por
                    pedido.
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    <strong className="text-white">Filtros y búsqueda</strong>: por cliente, número de pedido o email;
                    por estado del flujo (pendiente, validando, validado, enviado, etc.) y por prioridad (baja a
                    urgente).
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">
                    <strong className="text-white">Operación real</strong>: listado con scroll, exportar, vista de ítems
                    y totales, datos de contacto y envío, y seguimiento del ciclo hasta despacho.
                  </span>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 py-4 text-lg font-semibold rounded-xl"
              >
                <a href={STARTER_SUBSCRIPTION_CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
                  Suscribirse
                </a>
              </Button>
            </div>
          </div>

          <div className="group relative bg-black border border-white/10 rounded-3xl p-10 transition-all duration-500 hover:border-amber-500/20">
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-black/75 backdrop-blur-[3px] border border-amber-500/15">
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/40">
                  <Lock className="h-7 w-7 text-amber-400" strokeWidth={2} />
                </div>
                <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40 px-4 py-1.5 text-sm font-semibold">
                  Pronto
                </Badge>
                <p className="text-sm text-gray-400 max-w-[220px] leading-relaxed">
                  Estamos cerrando precios y límites del plan Professional.
                </p>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent rounded-3xl opacity-60 pointer-events-none" />

            <div className="relative z-10 pointer-events-none select-none opacity-40">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Professional</h3>
                <p className="text-gray-400 text-lg leading-relaxed">Para negocios en crecimiento y equipos medianos</p>
              </div>

              <div className="text-center mb-10">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-white">—</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Precio por anunciar</p>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-300" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">Mayor volumen de mensajes y tiendas</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-300" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">Soporte prioritario</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-500/30 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-300" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">Automatizaciones y reportes avanzados</span>
                </div>
              </div>

              <Button
                disabled
                className="w-full bg-gray-800 text-gray-500 border border-gray-700 py-4 text-lg rounded-xl cursor-not-allowed"
              >
                No disponible aún
              </Button>
            </div>
          </div>

          <div className="group relative bg-black border border-white/10 rounded-3xl p-10 transition-all duration-500 hover:border-violet-500/25">
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-3xl bg-black/75 backdrop-blur-[3px] border border-violet-500/15">
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 border border-violet-500/40">
                  <Lock className="h-7 w-7 text-violet-300" strokeWidth={2} />
                </div>
                <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/40 px-4 py-1.5 text-sm font-semibold">
                  Pronto
                </Badge>
                <p className="text-sm text-gray-400 max-w-[220px] leading-relaxed">
                  Enterprise con SLA, integraciones a medida y acompañamiento dedicado.
                </p>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent rounded-3xl opacity-60 pointer-events-none" />

            <div className="relative z-10 pointer-events-none select-none opacity-40">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Enterprise</h3>
                <p className="text-gray-400 text-lg leading-relaxed">Para grandes corporaciones y equipos globales</p>
              </div>

              <div className="text-center mb-10">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-white">—</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Cotización a medida</p>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">Volumen y multi‑cuenta a escala</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">API, webhooks e integraciones custom</span>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className="text-gray-300 leading-relaxed">Soporte con responsable dedicado</span>
                </div>
              </div>

              <Button
                disabled
                className="w-full bg-gray-800 text-gray-500 border border-gray-700 py-4 text-lg rounded-xl cursor-not-allowed"
              >
                No disponible aún
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6">¿Necesitas un plan personalizado?</p>
          <Link to="/suscribirse">
            <Button
              variant="outline"
              className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/70 transition-all duration-300 px-8 py-3"
            >
              Hablar con un Experto
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
