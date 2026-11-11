import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Indicadores da tela Início, calculados no servidor (GET /api/dashboard).
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard").then((r) => r.data)
  });
}
