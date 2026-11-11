import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, definirToken, quandoSessaoExpirar, renovarSessao } from "@/lib/api";
import { PERFIS } from "@/lib/perfis";

// Quem está logado. Uso: const { usuario, entrar, sair } = useAuth();
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  function encerrar() {
    definirToken(null);
    setUsuario(null);
    queryClient.clear(); // não deixa dados de um usuário para o próximo
  }

  useEffect(() => {
    quandoSessaoExpirar(encerrar);
    // Ao abrir/recarregar a página: tenta recuperar a sessão pelo cookie.
    renovarSessao()
      .then((dados) => setUsuario(dados.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function entrar({ email, senha }) {
    const { data } = await api("/auth/login", { method: "POST", body: { email, senha } });
    definirToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  async function sair() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    encerrar();
  }

  async function trocarSenha(dados) {
    const resposta = await api("/auth/senha", { method: "PATCH", body: dados });
    definirToken(resposta.data.token);
    setUsuario(resposta.data.usuario);
    return resposta;
  }

  const valor = {
    usuario,
    carregando,
    ehAdmin: usuario?.perfil === PERFIS.ADMIN,
    entrar,
    sair,
    trocarSenha
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return contexto;
}
