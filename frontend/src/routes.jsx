import { Link, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { RotaProtegida, RotaAdmin } from "@/features/auth/RotasProtegidas";
import { LoginPage } from "@/features/auth/LoginPage";
import { TrocarSenhaPage } from "@/features/auth/TrocarSenhaPage";
import { InicioPage } from "@/features/dashboard/InicioPage";
import { ChamadosPage } from "@/features/chamados/ChamadosPage";
import { CadastrosPage } from "@/features/cadastros/CadastrosPage";
import { UsuariosPage } from "@/features/usuarios/UsuariosPage";
import { EmptyState } from "@/components/ui/States";
import { classesBotao } from "@/components/ui/Button";

function NaoEncontrada() {
  return (
    <EmptyState
      titulo="Página não encontrada"
      descricao="O endereço digitado não existe."
      acao={
        <Link to="/" className={classesBotao({ variante: "secundaria" })}>
          Voltar ao início
        </Link>
      }
    />
  );
}

/**
 * Rotas da aplicação.
 *   /login              público
 *   /trocar-senha       logado (obrigatória enquanto a senha for temporária)
 *   demais              logado, dentro do AppLayout
 *   dentro de <RotaAdmin>: só administrador (a API também confere)
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RotaProtegida />}>
        <Route path="trocar-senha" element={<TrocarSenhaPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="chamados" element={<ChamadosPage />} />
          <Route element={<RotaAdmin />}>
            <Route path="cadastros" element={<CadastrosPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  );
}
