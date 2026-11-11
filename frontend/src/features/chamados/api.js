import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Hooks de dados dos chamados. As telas usam estes hooks; nunca chamam fetch direto.

/**
 * Lista paginada com filtros feitos no servidor. Devolve { data: [...], meta: { total, pagina, paginas } }.
 * keepPreviousData: ao trocar de página/filtro, a lista anterior fica na tela até a nova chegar (sem "piscar").
 */
export function useChamados(filtros = {}) {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== "" && v !== undefined && v !== null));
  return useQuery({
    queryKey: ["chamados", "lista", Object.fromEntries(params)],
    queryFn: () => api(`/chamados?${params}`),
    placeholderData: keepPreviousData
  });
}

export function useChamado(id) {
  return useQuery({
    queryKey: ["chamados", Number(id)],
    queryFn: () => api(`/chamados/${id}`).then((r) => r.data),
    enabled: Boolean(id)
  });
}

// Depois de gravar, marca a lista como desatualizada para ela ser buscada de novo.
function useMutacaoChamado(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamados"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCriarChamado() {
  return useMutacaoChamado((dados) => api("/chamados", { method: "POST", body: dados }));
}

export function useAtualizarChamado() {
  return useMutacaoChamado(({ id, dados }) => api(`/chamados/${id}`, { method: "PATCH", body: dados }));
}

// Linha do tempo. A chave fica "embaixo" de ["chamados", id]: toda ação que atualiza os chamados atualiza o histórico também.
export function useHistorico(id) {
  return useQuery({
    queryKey: ["chamados", Number(id), "historico"],
    queryFn: () => api(`/chamados/${id}/historico`).then((r) => r.data),
    enabled: Boolean(id)
  });
}

export function useAssumirChamado() {
  return useMutacaoChamado((id) => api(`/chamados/${id}/assumir`, { method: "POST" }));
}

export function useComentarChamado() {
  return useMutacaoChamado(({ id, texto, interna }) => api(`/chamados/${id}/observacoes`, { method: "POST", body: { texto, interna } }));
}

export function useReabrirChamado() {
  return useMutacaoChamado(({ id, motivo }) => api(`/chamados/${id}/reabrir`, { method: "POST", body: { motivo } }));
}

export function useCancelarChamado() {
  return useMutacaoChamado((id) => api(`/chamados/${id}/cancelar`, { method: "POST" }));
}

export function useExcluirChamado() {
  return useMutacaoChamado((id) => api(`/chamados/${id}`, { method: "DELETE" }));
}
