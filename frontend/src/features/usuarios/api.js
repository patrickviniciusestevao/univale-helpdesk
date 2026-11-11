import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Gestão de usuários (só administrador).

// enabled: false evita a busca para quem não é admin (ex.: formulário de chamado do usuário comum).
export function useUsuarios({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: () => api("/usuarios").then((r) => r.data),
    enabled
  });
}

function useMutacaoUsuario(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["chamados"] }); // nome/setor do solicitante aparecem nos chamados
    }
  });
}

// Sem id: cria (a resposta traz a senha temporária). Com id: altera.
export function useSalvarUsuario() {
  return useMutacaoUsuario(({ id, dados }) =>
    id ? api(`/usuarios/${id}`, { method: "PATCH", body: dados }) : api("/usuarios", { method: "POST", body: dados })
  );
}

export function useRedefinirSenha() {
  return useMutacaoUsuario((id) => api(`/usuarios/${id}/redefinir-senha`, { method: "POST" }));
}
