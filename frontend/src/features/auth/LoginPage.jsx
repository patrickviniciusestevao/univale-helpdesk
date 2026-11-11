import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";
import { useAuth } from "./AuthContext";
import { CampoSenha } from "./CampoSenha";

export function LoginPage() {
  const { usuario, carregando, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [valores, setValores] = useState({ email: "", senha: "" });
  const login = useMutation({ mutationFn: entrar });

  // Já logado? Vai direto para o sistema.
  if (!carregando && usuario) return <Navigate to="/" replace />;

  const errosCampo = Object.fromEntries((login.error?.details ?? []).map((d) => [d.campo, d.mensagem]));
  const alterar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    login.mutate(valores, {
      // Volta para a página que a pessoa tentou abrir antes do login.
      onSuccess: () => navegar(local.state?.de?.pathname ?? "/", { replace: true })
    });
  }

  return (
    <AuthLayout titulo="Entrar" descricao="Use seu e-mail e senha para acessar o helpdesk.">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {login.error && !login.error.details && <Alert tom="perigo">{login.error.message}</Alert>}

        <Field rotulo="E-mail" erro={errosCampo.email}>
          <Input
            type="email"
            value={valores.email}
            onChange={alterar("email")}
            autoComplete="username"
            inputMode="email"
            placeholder="nome@exemplo.com"
            required
            autoFocus
          />
        </Field>

        <Field rotulo="Senha" erro={errosCampo.senha}>
          <CampoSenha value={valores.senha} onChange={alterar("senha")} autoComplete="current-password" required />
        </Field>

        <Button type="submit" carregando={login.isPending} className="mt-2 w-full">
          {!login.isPending && <LogIn className="size-4" aria-hidden />}
          Entrar
        </Button>

        <p className="text-center text-sm text-texto-suave">Não tem acesso ou esqueceu a senha? Procure o administrador.</p>
      </form>
    </AuthLayout>
  );
}
