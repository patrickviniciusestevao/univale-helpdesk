import { useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { useCadastro, opcoesAtivas } from "@/features/cadastros/api";
import { useUsuarios } from "@/features/usuarios/api";
import { PERFIS } from "@/lib/perfis";

function valoresIniciais(chamado) {
  return {
    titulo: chamado?.titulo ?? "",
    categoria_id: chamado?.categoria_id ?? "",
    prioridade_id: chamado?.prioridade_id ?? "",
    status_id: chamado?.status_id ?? "",
    setor_id: chamado?.setor_id ?? "",
    usuario_responsavel_id: chamado?.usuario_responsavel_id ?? "",
    descricao: chamado?.descricao ?? ""
  };
}

/**
 * Formulário de abrir/editar chamado. Os botões ficam no rodapé do Modal e apontam para o form pelo id (formId).
 * Solicitante e setor vêm do usuário logado — não são digitados.
 * completo = administrador editando: também mostra status, setor e responsável.
 * Erros de validação vêm da API (erro.details) e aparecem embaixo de cada campo.
 */
export function ChamadoForm({ formId, chamado, completo = false, erro, onSalvar }) {
  const [valores, setValores] = useState(() => valoresIniciais(chamado));
  const categorias = useCadastro("categorias");
  const prioridades = useCadastro("prioridades");
  const status = useCadastro("status");
  const setores = useCadastro("setores");
  const usuarios = useUsuarios({ enabled: completo }); // lista de usuários: só o admin pode buscar
  // Responsável: administradores ativos (mais o atual, mesmo que tenha sido desativado).
  const responsaveis = (usuarios.data ?? []).filter(
    (u) => u.perfil === PERFIS.ADMIN && (u.ativo || u.id === Number(valores.usuario_responsavel_id))
  );

  // { titulo: "Informe o título.", ... } a partir da resposta da API
  const errosCampo = Object.fromEntries((erro?.details ?? []).map((d) => [d.campo, d.mensagem]));
  const erroGeral = erro && !erro.details ? erro.message : null;

  const alterar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  function enviar(e) {
    e.preventDefault();
    const dados = {
      titulo: valores.titulo,
      descricao: valores.descricao,
      categoria_id: Number(valores.categoria_id),
      prioridade_id: Number(valores.prioridade_id)
    };
    // Status e setor: só o administrador altera (a API recusa se outro perfil enviar).
    if (completo) {
      dados.status_id = Number(valores.status_id);
      dados.setor_id = valores.setor_id ? Number(valores.setor_id) : null;
      dados.usuario_responsavel_id = valores.usuario_responsavel_id ? Number(valores.usuario_responsavel_id) : null;
    }
    onSalvar(dados);
  }

  function opcoes(consulta, campo) {
    return opcoesAtivas(consulta.data, valores[campo]).map((item) => (
      <option key={item.id} value={item.id}>
        {item.nome}
        {!item.ativo && " (desativado)"}
      </option>
    ));
  }

  return (
    <form id={formId} onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
      {erroGeral && (
        <Alert tom="perigo" className="sm:col-span-2">
          {erroGeral}
        </Alert>
      )}

      <Field rotulo="Título" obrigatorio erro={errosCampo.titulo} className="sm:col-span-2">
        <Input value={valores.titulo} onChange={alterar("titulo")} maxLength={150} required autoFocus placeholder="Ex.: Impressora não imprime" />
      </Field>

      <Field rotulo="Categoria" obrigatorio erro={errosCampo.categoria_id}>
        <Select value={valores.categoria_id} onChange={alterar("categoria_id")} required>
          <option value="" disabled>
            Selecione...
          </option>
          {opcoes(categorias, "categoria_id")}
        </Select>
      </Field>

      <Field
        rotulo="Prioridade"
        obrigatorio
        erro={errosCampo.prioridade_id}
        dica={completo ? undefined : "A equipe de suporte pode ajustar depois."}
      >
        <Select value={valores.prioridade_id} onChange={alterar("prioridade_id")} required>
          <option value="" disabled>
            Selecione...
          </option>
          {opcoes(prioridades, "prioridade_id")}
        </Select>
      </Field>

      {completo && (
        <>
          <Field rotulo="Status" obrigatorio erro={errosCampo.status_id}>
            <Select value={valores.status_id} onChange={alterar("status_id")} required>
              {opcoes(status, "status_id")}
            </Select>
          </Field>
          <Field rotulo="Setor" erro={errosCampo.setor_id}>
            <Select value={valores.setor_id} onChange={alterar("setor_id")}>
              <option value="">Sem setor</option>
              {opcoes(setores, "setor_id")}
            </Select>
          </Field>
          <Field rotulo="Responsável" erro={errosCampo.usuario_responsavel_id} className="sm:col-span-2">
            <Select value={valores.usuario_responsavel_id} onChange={alterar("usuario_responsavel_id")}>
              <option value="">Ninguém (aguardando)</option>
              {responsaveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                  {!u.ativo && " (desativado)"}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}

      <Field rotulo="Descrição" obrigatorio erro={errosCampo.descricao} className="sm:col-span-2">
        <Textarea value={valores.descricao} onChange={alterar("descricao")} maxLength={5000} required placeholder="Descreva o problema com detalhes: o que aconteceu, onde, desde quando." />
      </Field>
    </form>
  );
}
