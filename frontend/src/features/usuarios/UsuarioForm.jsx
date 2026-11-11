import { useState } from "react";
import { Field, Input, Select, Checkbox } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { PERFIS, ROTULO_PERFIL } from "@/lib/perfis";
import { useCadastro, opcoesAtivas } from "@/features/cadastros/api";

/**
 * Formulário de usuário. eleMesmo = o administrador editando a si mesmo:
 * perfil e "ativo" ficam travados (a API também recusa).
 */
export function UsuarioForm({ formId, usuario, eleMesmo, erro, onSalvar }) {
  const [valores, setValores] = useState({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    perfil: usuario?.perfil ?? PERFIS.USUARIO,
    setor_id: usuario?.setor_id ?? "",
    ativo: usuario?.ativo ?? true
  });
  const setores = useCadastro("setores");
  const errosCampo = Object.fromEntries((erro?.details ?? []).map((d) => [d.campo, d.mensagem]));
  const erroGeral = erro && !erro.details ? erro.message : null;

  const alterar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValores((v) => ({ ...v, [campo]: valor }));
  };

  function enviar(e) {
    e.preventDefault();
    const dados = { ...valores, setor_id: valores.setor_id ? Number(valores.setor_id) : null };
    if (!usuario) delete dados.ativo; // usuário novo nasce ativo
    onSalvar(dados);
  }

  return (
    <form id={formId} onSubmit={enviar} className="flex flex-col gap-4">
      {erroGeral && <Alert tom="perigo">{erroGeral}</Alert>}

      <Field rotulo="Nome completo" obrigatorio erro={errosCampo.nome}>
        <Input value={valores.nome} onChange={alterar("nome")} maxLength={120} required autoFocus />
      </Field>

      <Field rotulo="E-mail" obrigatorio erro={errosCampo.email} dica="É com ele que a pessoa entra no sistema.">
        <Input type="email" value={valores.email} onChange={alterar("email")} maxLength={150} inputMode="email" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field rotulo="Perfil" obrigatorio erro={errosCampo.perfil} dica={eleMesmo ? "Você não pode mudar o seu próprio perfil." : undefined}>
          <Select value={valores.perfil} onChange={alterar("perfil")} disabled={eleMesmo}>
            {Object.values(PERFIS).map((p) => (
              <option key={p} value={p}>
                {ROTULO_PERFIL[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field rotulo="Setor" erro={errosCampo.setor_id}>
          <Select value={valores.setor_id} onChange={alterar("setor_id")}>
            <option value="">Sem setor</option>
            {opcoesAtivas(setores.data, valores.setor_id).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
                {!s.ativo && " (desativado)"}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <p className="text-sm text-texto-suave">
        <strong className="font-medium text-texto">Usuário</strong>: abre e acompanha os próprios chamados.{" "}
        <strong className="font-medium text-texto">Administrador</strong>: vê e gerencia todos os chamados, cadastros e usuários.
      </p>

      {usuario && (
        <div className="border-t border-borda pt-4">
          <Checkbox
            rotulo="Ativo"
            descricao={eleMesmo ? "Você não pode desativar o seu próprio usuário." : "Desativado não consegue entrar; os chamados dele continuam no sistema."}
            checked={valores.ativo}
            onChange={alterar("ativo")}
            disabled={eleMesmo}
          />
        </div>
      )}
    </form>
  );
}
