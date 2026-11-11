import { useState } from "react";
import { Ban, Pencil, Trash2, UserCheck, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Alert, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import {
  useChamado,
  useCriarChamado,
  useAtualizarChamado,
  useAssumirChamado,
  useCancelarChamado,
  useReabrirChamado,
  useExcluirChamado
} from "../api";
import { permissoesChamado, PRAZO_REABERTURA_DIAS, TIPO_STATUS } from "../permissoes";
import { ChamadoForm } from "./ChamadoForm";
import { ChamadoDetalhe } from "./ChamadoDetalhe";
import { ChamadoHistorico } from "./ChamadoHistorico";

const FORM_ID = "form-chamado";

// Textos das confirmações (cancelar, excluir, reabrir).
const CONFIRMACOES = {
  cancelar: {
    titulo: "Cancelar este chamado?",
    texto: "O chamado fica registrado como Cancelado e sai da fila de atendimento.",
    botao: "Sim, cancelar chamado",
    variante: "perigo"
  },
  excluir: {
    titulo: "Excluir definitivamente?",
    texto: "O chamado e todo o histórico serão apagados e não poderão ser recuperados. Use só para testes ou duplicados — no dia a dia, prefira cancelar.",
    botao: "Excluir definitivamente",
    variante: "perigo"
  },
  reabrir: {
    titulo: "Reabrir este chamado?",
    texto: "Conte o que aconteceu: o chamado volta para a fila de atendimento.",
    botao: "Reabrir chamado",
    variante: "primaria"
  }
};

/**
 * Modal do chamado em três modos, controlados pela URL (ver ChamadosPage):
 *   novo   → ?novo=1
 *   ver    → ?chamado=17   (detalhe + histórico + ações)
 *   editar → ?chamado=17&editar=1
 */
export function ChamadoModal({ modo, id, onFechar, onVer, onEditar }) {
  const toast = useToast();
  const { usuario } = useAuth();
  const [confirmando, setConfirmando] = useState(null); // null | "cancelar" | "excluir" | "reabrir"
  const [motivo, setMotivo] = useState("");
  const consulta = useChamado(modo === "novo" ? null : id);
  const criar = useCriarChamado();
  const atualizar = useAtualizarChamado();
  const assumir = useAssumirChamado();
  const cancelar = useCancelarChamado();
  const reabrir = useReabrirChamado();
  const excluir = useExcluirChamado();

  const chamado = consulta.data;

  // Mostra a mensagem que a API devolveu ("Chamado aberto com sucesso.")
  const aoSucesso = (depois) => (resposta) => {
    toast.sucesso(resposta.message);
    depois?.();
  };
  const aoErro = (erro) => toast.erro(erro.message);

  if (modo === "novo") {
    return (
      <Modal
        aberto
        onFechar={onFechar}
        titulo="Abrir chamado"
        descricao="Conte o que está acontecendo. A equipe de suporte vai acompanhar por aqui."
        tamanho="lg"
        rodape={
          <>
            <Button variante="secundaria" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} carregando={criar.isPending}>
              Abrir chamado
            </Button>
          </>
        }
      >
        <ChamadoForm formId={FORM_ID} erro={criar.error} onSalvar={(dados) => criar.mutate(dados, { onSuccess: aoSucesso(onFechar) })} />
      </Modal>
    );
  }

  const titulo = `Chamado #${id}`;

  if (consulta.isPending || consulta.isError) {
    return (
      <Modal aberto onFechar={onFechar} titulo={titulo}>
        {consulta.isPending ? <LoadingState texto="Carregando chamado..." /> : <Alert tom="perigo">{consulta.error.message}</Alert>}
      </Modal>
    );
  }

  const pode = permissoesChamado(chamado, usuario);

  if (modo === "editar" && pode.editar) {
    return (
      <Modal
        aberto
        onFechar={onFechar}
        titulo={`Editar chamado #${id}`}
        tamanho="lg"
        rodape={
          <>
            <Button
              variante="secundaria"
              onClick={() => {
                atualizar.reset(); // não leva o erro antigo para a próxima edição
                onVer();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} carregando={atualizar.isPending}>
              Salvar alterações
            </Button>
          </>
        }
      >
        <ChamadoForm
          formId={FORM_ID}
          chamado={chamado}
          completo={pode.editarCamposDaEquipe}
          erro={atualizar.error}
          onSalvar={(dados) => atualizar.mutate({ id, dados }, { onSuccess: aoSucesso(onVer) })}
        />
      </Modal>
    );
  }

  // ---- modo "ver" (ou "editar" sem permissão) ----
  const confirmacao = confirmando && CONFIRMACOES[confirmando];
  const acoesConfirmadas = {
    cancelar: () => cancelar.mutate(id, { onSuccess: aoSucesso(() => setConfirmando(null)), onError: aoErro }),
    excluir: () => excluir.mutate(id, { onSuccess: aoSucesso(onFechar), onError: aoErro }),
    reabrir: () =>
      reabrir.mutate(
        { id, motivo },
        {
          onSuccess: aoSucesso(() => {
            setConfirmando(null);
            setMotivo("");
          }),
          onError: aoErro
        }
      )
  };
  const pendente = { cancelar: cancelar.isPending, excluir: excluir.isPending, reabrir: reabrir.isPending }[confirmando];

  const rodape = confirmacao ? (
    <>
      <Button variante="secundaria" onClick={() => setConfirmando(null)}>
        Voltar
      </Button>
      <Button
        variante={confirmacao.variante}
        carregando={pendente}
        disabled={confirmando === "reabrir" && !motivo.trim()}
        onClick={acoesConfirmadas[confirmando]}
      >
        {confirmacao.botao}
      </Button>
    </>
  ) : (
    <>
      <div className="mr-auto flex flex-wrap gap-1">
        {pode.excluir && (
          <Button variante="perigo-fantasma" tamanho="icone" onClick={() => setConfirmando("excluir")} aria-label="Excluir definitivamente" title="Excluir definitivamente">
            <Trash2 className="size-4" />
          </Button>
        )}
        {pode.cancelar && (
          <Button variante="perigo-fantasma" onClick={() => setConfirmando("cancelar")}>
            <Ban className="size-4" aria-hidden />
            Cancelar chamado
          </Button>
        )}
      </div>
      {pode.reabrir && (
        <Button variante="secundaria" onClick={() => setConfirmando("reabrir")}>
          <RotateCcw className="size-4" aria-hidden />
          Reabrir
        </Button>
      )}
      {pode.editar && (
        <Button variante="secundaria" onClick={onEditar}>
          <Pencil className="size-4" aria-hidden />
          Editar
        </Button>
      )}
      {pode.assumir && (
        <Button carregando={assumir.isPending} onClick={() => assumir.mutate(id, { onSuccess: aoSucesso(), onError: aoErro })}>
          {!assumir.isPending && <UserCheck className="size-4" aria-hidden />}
          Assumir atendimento
        </Button>
      )}
    </>
  );

  const dono = chamado.usuario_solicitante_id === usuario.id;

  return (
    <Modal aberto onFechar={onFechar} titulo={titulo} tamanho="xl" rodape={rodape}>
      {confirmacao && (
        <div className="mb-6 flex flex-col gap-3">
          <Alert tom={confirmando === "reabrir" ? "info" : "perigo"} titulo={confirmacao.titulo}>
            {confirmacao.texto}
          </Alert>
          {confirmando === "reabrir" && (
            <Field rotulo="Motivo da reabertura" obrigatorio>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} placeholder="Ex.: a impressora voltou a travar hoje de manhã." autoFocus />
            </Field>
          )}
        </div>
      )}

      {!confirmacao && dono && !pode.editar && chamado.status_tipo === TIPO_STATUS.ANDAMENTO && (
        <Alert tom="info" className="mb-5">
          A equipe de suporte já está cuidando deste chamado. Use o histórico para mandar uma mensagem.
        </Alert>
      )}
      {!confirmacao && dono && chamado.status_tipo === TIPO_STATUS.RESOLVIDO && !pode.reabrir && (
        <Alert tom="info" className="mb-5">
          O prazo para reabrir ({PRAZO_REABERTURA_DIAS} dias) já passou. Se o problema voltou, abra um novo chamado e cite o nº #{id}.
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ChamadoDetalhe chamado={chamado} />
        <div className="border-t border-borda pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <ChamadoHistorico chamadoId={id} podeComentar={pode.comentar} podeInterna={pode.observacaoInterna} />
        </div>
      </div>
    </Modal>
  );
}
