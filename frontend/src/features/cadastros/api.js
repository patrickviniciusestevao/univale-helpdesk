import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Lista de um cadastro auxiliar: "categorias", "prioridades", "status" ou "setores".
 * Traz ativos e inativos (o formulário decide o que mostrar); muda pouco, então fica 5 min em cache.
 */
export function useCadastro(tipo) {
  return useQuery({
    queryKey: ["cadastros", tipo],
    queryFn: () => api(`/cadastros/${tipo}`).then((r) => r.data),
    staleTime: 5 * 60_000
  });
}

// Opções de um <select>: só os ativos, mais o valor atual (mesmo que tenha sido desativado depois).
export function opcoesAtivas(lista = [], valorAtual) {
  return lista.filter((item) => item.ativo || item.id === Number(valorAtual));
}

/**
 * Cria (sem id) ou altera (com id) um item do cadastro. Só administrador.
 * Depois, atualiza a lista do cadastro e os chamados (que mostram nomes e cores dos cadastros).
 */
export function useSalvarCadastro(tipo) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }) =>
      id ? api(`/cadastros/${tipo}/${id}`, { method: "PATCH", body: dados }) : api(`/cadastros/${tipo}`, { method: "POST", body: dados }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cadastros", tipo] });
      queryClient.invalidateQueries({ queryKey: ["chamados"] });
    }
  });
}
