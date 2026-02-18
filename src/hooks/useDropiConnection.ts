import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { dropiApi } from "@/lib/dropi-service";

export interface DropiConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  email?: string;
}

export function useDropiConnection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<DropiConnectionStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setStatus({ isConnected: false, isLoading: false, error: null });
      return;
    }

    setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: config, error: configError } = await supabase
        .from("user_external_configs")
        .select("config_data")
        .eq("user_id", user.id)
        .eq("service_name", "dropi")
        .eq("is_active", true)
        .single();

      if (configError && configError.code !== "PGRST116") {
        throw configError;
      }

      if (!config?.config_data) {
        setStatus({ isConnected: false, isLoading: false, error: null });
        return;
      }

      const { token, baseUrl, email } = config.config_data as {
        token?: string;
        baseUrl?: string;
        email?: string;
      };
      if (!token || !baseUrl) {
        setStatus({ isConnected: false, isLoading: false, error: null });
        return;
      }

      try {
        await dropiApi("categories/list");
        setStatus({
          isConnected: true,
          isLoading: false,
          error: null,
          email: email ?? undefined,
        });
      } catch (apiErr) {
        const msg =
          (apiErr as Error & { code?: string })?.code === "TOKEN_EXPIRED"
            ? "Sesión expirada. Reconecta Dropi."
            : "Error al validar conexión con Dropi";
        setStatus({
          isConnected: false,
          isLoading: false,
          error: msg,
        });
      }
    } catch (err) {
      console.error("Error verificando conexión Dropi:", err);
      setStatus({
        isConnected: false,
        isLoading: false,
        error: err instanceof Error ? err.message : "Error inesperado",
      });
    }
  }, [user?.id]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return { ...status, refresh: checkConnection };
}
