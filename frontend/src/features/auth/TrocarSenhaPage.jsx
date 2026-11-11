import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Field } from "@/components/ui/Field";
import { Button, classesBotao } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "./AuthContext";
import { CampoSenha } from "./CampoSenha";

export function TrocarSenhaPage() {
  const { usuario, trocarSenha, sair } = useAuth();
  const navegar = useNavigate();
  const toast = useToast();
  const [valores, setValores] = useState({ senha_atual: "", nova_senha: "", confirmacao: "" });
  const [erroConfirmacao, setErroConfirmacao] = useState(null);
  const troca = useMutation({ mutationFn: trocarSenha });
  const primeiroAcesso = usuario.trocar_senha;

  const errosCampo = Object.fromEntries((troca.error?.details ?? []).map((d) => [d.campo, d.mensagem]));
  const alterar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    // Conferência feita só na tela: a API recebe apenas a senha atual e a nova.
    if (valores.nova_senha !== valores.confirmacao) {
      setErroConfirmacao("As senhas não conferem.");
      return;
    }
    setErroConfirmacao(null);
    troca.mutate(
      { senha_atual: valores.senha_atual, nova_senha: valores.nova_senha },
      {
        onSuccess: (resposta) => {
          toast.sucesso(resposta.message);
          navegar("/", { replace: true });
        }
      }
    );
  }

  return (
    <AuthLayout
      titulo={primeiroAcesso ? "Crie sua senha" : "Trocar senha"}
      descricao={primeiroAcesso ? `Olá, ${usuario.nome.split(" ")[0]}! Antes de começar, troque a senha temporária.` : "Informe a senha atual e escolha uma nova."}
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {troca.error && !troca.error.details && <Alert tom="perigo">{troca.error.message}</Alert>}

        <Field rotulo={primeiroAcesso ? "Senha temporária" : "Senha atual"} erro={errosCampo.senha_atual}>
          <CampoSenha value={valores.senha_atual} onChange={alterar("senha_atual")} autoComplete="current-password" required autoFocus />
        </Field>

        <Field rotulo="Nova senha" erro={errosCampo.nova_senha} dica="Mínimo de 8 caracteres, com letras e números.">
          <CampoSenha value={valores.nova_senha} onChange={alterar("nova_senha")} autoComplete="new-password" minLength={8} required />
        </Field>

        <Field rotulo="Repita a nova senha" erro={erroConfirmacao}>
          <CampoSenha value={valores.confirmacao} onChange={alterar("confirmacao")} autoComplete="new-password" required />
        </Field>

        <Button type="submit" carregando={troca.isPending} className="mt-2 w-full">
          Salvar nova senha
        </Button>

        {primeiroAcesso ? (
          <Button variante="fantasma" className="w-full" onClick={sair}>
            Sair
          </Button>
        ) : (
          <Link to="/" className={classesBotao({ variante: "fantasma", className: "w-full" })}>
            Voltar
          </Link>
        )}
      </form>
    </AuthLayout>
  );
}
