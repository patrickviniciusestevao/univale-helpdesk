import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

function TelaCarregando() {
  return (
    <div className="flex min-h-dvh items-center justify-center gap-2 text-texto-suave">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      Carregando...
    </div>
  );
}

/**
 * Só deixa passar quem está logado. Sem login → /login (e volta para onde estava depois).
 * Com senha temporária → obrigatoriamente /trocar-senha.
 */
export function RotaProtegida() {
  const { usuario, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <TelaCarregando />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: local }} />;
  if (usuario.trocar_senha && local.pathname !== "/trocar-senha") return <Navigate to="/trocar-senha" replace />;
  return <Outlet />;
}

// Só administrador (usado a partir da etapa 4.3). A API também confere — isto é só para a tela.
export function RotaAdmin() {
  const { ehAdmin } = useAuth();
  return ehAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
