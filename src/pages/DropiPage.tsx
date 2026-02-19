import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Truck,
  Package,
  FolderTree,
  AlertCircle,
  Link2,
  RefreshCw,
  Search,
  Clock,
  FileBox,
} from "lucide-react";
import { useDropiConnection } from "@/hooks/useDropiConnection";
import { dropi, disconnectDropi } from "@/lib/dropi-service";

type DropiOrder = {
  id?: number;
  status?: string;
  name?: string;
  surname?: string;
  dir?: string;
  phone?: string;
  client_email?: string;
  total_order?: string | number;
  created_at?: string;
  updated_at?: string;
  city?: string;
  state?: string;
  rate_type?: string;
};

type DropiProduct = {
  id?: number;
  name?: string;
  sku?: string;
  stock?: string | number;
  suggested_price?: string | number;
  objects?: unknown[];
};

export default function DropiPage() {
  const navigate = useNavigate();
  const { isConnected, isLoading: connLoading, error: connError, refresh } = useDropiConnection();

  const [orders, setOrders] = useState<DropiOrder[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<DropiOrder | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isConnected) {
      setOrders([]);
      setProductsCount(0);
      return;
    }
    setLoadingData(true);
    setDataError(null);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        dropi.orders({
          result_number: 100,
          start: 1,
          filter_date_by: "FECHA DE CREADO",
        }),
        dropi.products({ pageSize: 50, startData: 0 }),
      ]);
      const orderList = (ordersRes as { objects?: DropiOrder[] })?.objects ?? [];
      setOrders(Array.isArray(orderList) ? orderList : []);
      const prodRes = productsRes as { objects?: DropiProduct[]; total?: number };
      const prodList = prodRes?.objects ?? [];
      setProductsCount(
        typeof prodRes?.total === "number" ? prodRes.total : (Array.isArray(prodList) ? prodList.length : 0)
      );
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Error al cargar datos de Dropi");
      setOrders([]);
      setProductsCount(0);
    } finally {
      setLoadingData(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      !searchTerm ||
      [o.name, o.surname, o.client_email, o.phone, o.id, o.dir].some(
        (v) => v && String(v).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchStatus = statusFilter === "all" || (o.status ?? "") === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOrders = orders.length;
  const pendientes = orders.filter((o) => (o.status ?? "").toUpperCase() === "PENDIENTE").length;
  const guiaGenerada = orders.filter(
    (o) => (o.status ?? "").toUpperCase() === "GUIA_GENERADA"
  ).length;

  const handleDisconnect = async () => {
    try {
      await disconnectDropi();
      refresh();
      setOrders([]);
      setSelectedOrder(null);
      setProductsCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (connLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-white">Verificando conexión con Dropi...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Truck className="w-8 h-8 text-amber-500" />
              Dropi
            </h1>
            <p className="text-gray-400">
              Órdenes, productos y logística desde tu cuenta Dropi
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refresh()}
              variant="outline"
              className="text-white border-gray-500 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            {isConnected && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-900/50 text-red-300 hover:bg-red-900/20"
              >
                Desconectar Dropi
              </Button>
            )}
          </div>
        </div>

        {connError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connError}</AlertDescription>
          </Alert>
        )}

        {/* Tarjetas de métricas (siempre visibles; 0 si no hay login) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Órdenes</p>
                  <p className="text-2xl font-bold text-white">{totalOrders}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-400">{pendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Guía Generada</p>
                  <p className="text-2xl font-bold text-blue-400">{guiaGenerada}</p>
                </div>
                <FileBox className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Productos</p>
                  <p className="text-2xl font-bold text-green-400">{productsCount}</p>
                </div>
                <FolderTree className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda y filtros (solo útiles cuando hay conexión) */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, email, teléfono o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                    disabled={!isConnected}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-gray-600 bg-gray-800 px-3 text-white text-sm min-w-[180px]"
                  disabled={!isConnected}
                >
                  <option value="all">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="GUIA_GENERADA">Guía Generada</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dos paneles: lista de órdenes + detalles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Órdenes ({filteredOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No hay órdenes</h3>
                    <p className="text-gray-400 mb-4">
                      Conecta tu cuenta Dropi para ver órdenes y productos aquí
                    </p>
                    <Button
                      onClick={() => navigate("/dropi/connect")}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Conectar Dropi
                    </Button>
                  </div>
                ) : loadingData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : dataError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-300 mb-4">{dataError}</p>
                    <Button variant="outline" onClick={fetchData}>
                      Reintentar
                    </Button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No hay órdenes</h3>
                    <p className="text-gray-400">
                      {searchTerm || statusFilter !== "all"
                        ? "No se encontraron órdenes con los filtros aplicados"
                        : "Aún no tienes órdenes en Dropi"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <Card
                          key={order.id ?? order.created_at}
                          className={`bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors ${
                            selectedOrder?.id === order.id ? "ring-2 ring-amber-500" : ""
                          }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">
                                    #{order.id} · {order.name} {order.surname}
                                  </p>
                                  <p className="text-gray-400 text-sm">{order.client_email}</p>
                                </div>
                              </div>
                              <Badge
                                className={
                                  (order.status ?? "").toUpperCase() === "GUIA_GENERADA"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                }
                              >
                                {order.status ?? "PENDIENTE"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Ciudad</p>
                                <p className="text-white">{order.city ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Total</p>
                                <p className="text-white">
                                  {order.total_order != null ? `$${Number(order.total_order).toLocaleString()}` : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Actualizado</p>
                                <p className="text-white">
                                  {order.updated_at
                                    ? new Date(order.updated_at).toLocaleDateString("es-CL", {
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Detalles de la Orden</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">ID</Label>
                      <p className="text-white font-semibold">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Cliente</Label>
                      <p className="text-white">
                        {selectedOrder.name} {selectedOrder.surname}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Email</Label>
                      <p className="text-white">{selectedOrder.client_email ?? "—"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Teléfono</Label>
                      <p className="text-white">{selectedOrder.phone ?? "—"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Dirección</Label>
                      <p className="text-white">{selectedOrder.dir ?? "—"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Ciudad / Dept.</Label>
                      <p className="text-white">
                        {selectedOrder.city ?? "—"} {selectedOrder.state ? ` / ${selectedOrder.state}` : ""}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Estado</Label>
                      <Badge
                        className={
                          (selectedOrder.status ?? "").toUpperCase() === "GUIA_GENERADA"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                        }
                      >
                        {selectedOrder.status ?? "PENDIENTE"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-400">Total</Label>
                      <p className="text-white">
                        {selectedOrder.total_order != null
                          ? `$${Number(selectedOrder.total_order).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Creado</Label>
                      <p className="text-white">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Selecciona una orden para ver los detalles
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
