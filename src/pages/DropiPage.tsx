import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Truck,
  Package,
  FolderTree,
  AlertCircle,
  Link2,
  RefreshCw,
} from "lucide-react";
import { useDropiConnection } from "@/hooks/useDropiConnection";
import { dropi, disconnectDropi } from "@/lib/dropi-service";

type DropiProduct = {
  id?: number;
  name?: string;
  sku?: string;
  stock?: string | number;
  suggested_price?: string | number;
  sale_price?: string | number;
  type?: string;
};

type DropiCategory = { id?: number; name?: string; parent_category?: number };

export default function DropiPage() {
  const navigate = useNavigate();
  const { isConnected, isLoading, error, refresh } = useDropiConnection();
  const [products, setProducts] = useState<DropiProduct[]>([]);
  const [categories, setCategories] = useState<DropiCategory[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoadingProducts(true);
    setApiError(null);
    try {
      const res = await dropi.products({ pageSize: 30, startData: 0 });
      const list = (res as { objects?: DropiProduct[] })?.objects ?? [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Error al cargar productos");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    setApiError(null);
    try {
      const res = await dropi.categories();
      const list = (res as { objects?: DropiCategory[] })?.objects ?? [];
      setCategories(Array.isArray(list) ? list : []);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Error al cargar categorías");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadProducts();
      loadCategories();
    }
  }, [isConnected]);

  const handleDisconnect = async () => {
    try {
      await disconnectDropi();
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-gray-900/80 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Truck className="w-6 h-6 text-amber-500" />
              Integración Dropi
            </CardTitle>
            <p className="text-gray-400">
              Conecta tu cuenta Dropi para ver productos, categorías, órdenes y guías desde NOMADEV.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => navigate("/dropi/connect")}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Conectar Dropi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-amber-500" />
            Dropi
          </h1>
          <p className="text-gray-400 text-sm mt-1">Productos, categorías y datos de tu cuenta Dropi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()} className="border-gray-600 text-gray-300">
            <RefreshCw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="border-red-900/50 text-red-300 hover:bg-red-900/20">
            Desconectar
          </Button>
        </div>
      </div>

      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-900/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-amber-500" />
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {categories.length === 0 ? (
                  <li className="text-gray-500 text-sm">Sin categorías o error al cargar</li>
                ) : (
                  categories.map((c) => (
                    <li key={c.id ?? c.name} className="text-gray-300 text-sm flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        {c.id}
                      </Badge>
                      {c.name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {products.length === 0 ? (
                  <li className="text-gray-500 text-sm">Sin productos o error al cargar</li>
                ) : (
                  products.map((p) => (
                    <li
                      key={p.id ?? p.sku ?? p.name}
                      className="text-gray-300 text-sm border-b border-gray-700 pb-2 last:border-0"
                    >
                      <span className="font-medium text-white">{p.name ?? "Sin nombre"}</span>
                      {p.sku && (
                        <span className="ml-2 text-gray-500">SKU: {p.sku}</span>
                      )}
                      <span className="block text-gray-500 mt-0.5">
                        Stock: {p.stock ?? "—"} · Precio: {p.suggested_price ?? p.sale_price ?? "—"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
