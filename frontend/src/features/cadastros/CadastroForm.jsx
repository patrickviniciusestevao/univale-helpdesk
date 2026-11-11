import { useState } from "react";
import { Field, Input, Select, Checkbox } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/States";
import { CORES, TIPOS_STATUS } from "./config";

// Valores iniciais por tipo (item novo) ou do item sendo editado.
function valoresIniciais(tipo, item) {
  const base = { nome: item?.nome ?? "", ativo: item?.ativo ?? true };
  if (tipo === "prioridades") return { ...base, nivel: item?.nivel ?? 1, cor: item?.cor ?? "neutro" };
  if (tipo === "status") {
    return { ...base, tipo: item?.tipo ?? "andamento", inicial: item?.inicial ?? false, cor: item?.cor ?? "neutro", ordem: item?.ordem ?? 0 };
  }
  return base;
}

/**
 * Formulário de um item de cadastro. Os campos extras mudam conforme o tipo:
 *   prioridades → nível e cor;   status → tipo, cor, ordem e "status inicial".
 */
export function CadastroForm({ formId, tipo, item, erro, onSalvar }) {
  const [valores, setValores] = useState(() => valoresIniciais(tipo, item));
  const errosCampo = Object.fromEntries((erro?.details ?? []).map((d) => [d.campo, d.mensagem]));
  const erroGeral = erro && !erro.details ? erro.message : null;

  const alterar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValores((v) => ({ ...v, [campo]: valor }));
  };

  function enviar(e) {
    e.preventDefault();
    const dados = { ...valores };
    if ("nivel" in dados) dados.nivel = Number(dados.nivel);
    if ("ordem" in dados) dados.ordem = Number(dados.ordem);
    onSalvar(dados);
  }

  const eraInicial = Boolean(item?.inicial); // o inicial atual não pode ser desmarcado nem desativado

  return (
    <form id={formId} onSubmit={enviar} className="flex flex-col gap-4">
      {erroGeral && <Alert tom="perigo">{erroGeral}</Alert>}

      <Field rotulo="Nome" obrigatorio erro={errosCampo.nome}>
        <Input value={valores.nome} onChange={alterar("nome")} required autoFocus />
      </Field>

      {tipo === "status" && (
        <Field rotulo="Tipo" obrigatorio erro={errosCampo.tipo} dica={TIPOS_STATUS.find((t) => t.valor === valores.tipo)?.descricao}>
          <Select value={valores.tipo} onChange={alterar("tipo")} disabled={eraInicial}>
            {TIPOS_STATUS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {(tipo === "status" || tipo === "prioridades") && (
        <div className="grid gap-4 sm:grid-cols-2">
          {tipo === "prioridades" ? (
            <Field rotulo="Nível" obrigatorio erro={errosCampo.nivel} dica="1 = mais baixa. O maior nível é a alta prioridade.">
              <Input type="number" min={1} max={9} value={valores.nivel} onChange={alterar("nivel")} inputMode="numeric" required />
            </Field>
          ) : (
            <Field rotulo="Ordem" obrigatorio erro={errosCampo.ordem} dica="Posição nas listas (menor primeiro).">
              <Input type="number" min={0} max={999} value={valores.ordem} onChange={alterar("ordem")} inputMode="numeric" required />
            </Field>
          )}
          <Field rotulo="Cor" obrigatorio erro={errosCampo.cor}>
            <Select value={valores.cor} onChange={alterar("cor")}>
              {CORES.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {(tipo === "status" || tipo === "prioridades") && (
        <div className="flex items-center gap-2 text-sm text-texto-suave">
          Prévia: <Badge tom={valores.cor} ponto={tipo === "status"}>{valores.nome || "Nome"}</Badge>
        </div>
      )}

      <div className="mt-1 flex flex-col gap-3 border-t border-borda pt-4">
        {tipo === "status" && (
          <Checkbox
            rotulo="Status inicial"
            descricao={eraInicial ? "Para trocar, marque outro status como inicial." : "Todo chamado novo nasce com este status (precisa ser do tipo Aberto)."}
            checked={valores.inicial}
            onChange={alterar("inicial")}
            disabled={eraInicial}
          />
        )}
        <Checkbox
          rotulo="Ativo"
          descricao={eraInicial ? "O status inicial não pode ser desativado." : "Desativado: some das listas de escolha, mas continua nos chamados antigos."}
          checked={valores.ativo}
          onChange={alterar("ativo")}
          disabled={eraInicial}
        />
      </div>
    </form>
  );
}
