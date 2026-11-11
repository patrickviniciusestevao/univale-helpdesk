import { useState } from "react";
import { PlusCircle, RefreshCw, Gauge, UserCheck, Pencil, MessageSquare, RotateCcw, Lock, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatarDataHora, tempoRelativo } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea, Checkbox } from "@/components/ui/Field";
import { Alert, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useHistorico, useComentarChamado } from "../api";

const ICONES = {
  abertura: PlusCircle,
  status: RefreshCw,
  prioridade: Gauge,
  responsavel: UserCheck,
  edicao: Pencil,
  observacao: MessageSquare,
  reabertura: RotateCcw
};

const forte = (texto) => <strong className="font-medium text-texto">{texto}</strong>;

// Frase de cada tipo de linha: "Patrick mudou o status de Aberto para Em atendimento".
function descrever(h) {
  const quem = forte(h.usuario);
  switch (h.tipo) {
    case "abertura":
      return <>{quem} abriu o chamado</>;
    case "status":
      return (
        <>
          {quem} mudou o status de {forte(h.valor_anterior)} para {forte(h.valor_novo)}
        </>
      );
    case "prioridade":
      return (
        <>
          {quem} mudou a prioridade de {forte(h.valor_anterior)} para {forte(h.valor_novo)}
        </>
      );
    case "responsavel":
      if (!h.valor_novo) return <>{quem} removeu o responsável ({h.valor_anterior})</>;
      if (h.valor_novo === h.usuario) return <>{quem} assumiu o atendimento</>;
      return (
        <>
          {quem} definiu {forte(h.valor_novo)} como responsável
        </>
      );
    case "edicao":
      return (
        <>
          {quem} {h.texto.charAt(0).toLowerCase() + h.texto.slice(1)}
        </>
      );
    case "reabertura":
      return <>{quem} reabriu o chamado</>;
    case "observacao":
      return <>{quem}</>;
    default:
      return <>{quem}</>;
  }
}

/**
 * Linha do tempo do chamado + caixa para registrar observação.
 * podeComentar / podeInterna vêm das permissões (permissoes.js).
 */
export function ChamadoHistorico({ chamadoId, podeComentar, podeInterna }) {
  const historico = useHistorico(chamadoId);
  const comentar = useComentarChamado();
  const toast = useToast();
  const [texto, setTexto] = useState("");
  const [interna, setInterna] = useState(false);

  function enviar(e) {
    e.preventDefault();
    comentar.mutate(
      { id: chamadoId, texto, interna },
      {
        onSuccess: (r) => {
          toast.sucesso(r.message);
          setTexto("");
          setInterna(false);
        }
      }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">Histórico</h3>

      {historico.isPending ? (
        <LoadingState texto="Carregando histórico..." />
      ) : historico.isError ? (
        <Alert tom="perigo">{historico.error.message}</Alert>
      ) : (
        <ol className="relative flex flex-col gap-4 before:absolute before:inset-y-2 before:left-4 before:w-px before:bg-borda">
          {historico.data.map((h) => {
            const Icone = ICONES[h.tipo] ?? MessageSquare;
            const comTexto = h.tipo === "observacao" || h.tipo === "reabertura";
            return (
              <li key={h.id} className="relative flex gap-3">
                <span
                  className={cn(
                    "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-borda bg-superficie",
                    h.interna ? "text-aviso" : comTexto ? "text-primaria" : "text-texto-suave"
                  )}
                >
                  <Icone className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm text-texto-suave">
                    {descrever(h)}
                    <span className="mx-1.5">·</span>
                    <time dateTime={h.criado_em} title={formatarDataHora(h.criado_em)}>
                      {tempoRelativo(h.criado_em)}
                    </time>
                  </p>
                  {comTexto && h.texto && (
                    <div
                      className={cn(
                        "mt-2 rounded-lg px-3 py-2 text-[15px] whitespace-pre-line",
                        h.interna ? "border border-dashed border-aviso bg-aviso-suave" : "bg-superficie-2"
                      )}
                    >
                      {h.interna && (
                        <Badge tom="aviso" ponto={false} className="mb-1.5">
                          <Lock className="size-3" aria-hidden /> Interna — só a equipe vê
                        </Badge>
                      )}
                      {h.tipo === "reabertura" && <span className="block text-sm text-texto-suave">Motivo:</span>}
                      {h.texto}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {podeComentar && (
        <form onSubmit={enviar} className="flex flex-col gap-3 border-t border-borda pt-4">
          {comentar.error && <Alert tom="perigo">{comentar.error.message}</Alert>}
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={podeInterna ? "Registrar uma observação sobre o atendimento..." : "Escreva uma mensagem para a equipe de suporte..."}
            maxLength={5000}
            required
            className="min-h-20"
            aria-label="Nova observação"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {podeInterna ? (
              <Checkbox rotulo="Observação interna" descricao="Só a equipe vê." checked={interna} onChange={(e) => setInterna(e.target.checked)} />
            ) : (
              <span />
            )}
            <Button type="submit" tamanho="sm" carregando={comentar.isPending} disabled={!texto.trim()}>
              <Send className="size-3.5" aria-hidden />
              Enviar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
