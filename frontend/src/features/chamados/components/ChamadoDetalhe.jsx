import { formatarDataHora } from "@/lib/format";
import { StatusBadge, PrioridadeBadge } from "./ChamadoBadges";

function Item({ rotulo, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-texto-suave">{rotulo}</dt>
      <dd className="mt-1 text-[15px] break-words">{children || "—"}</dd>
    </div>
  );
}

export function ChamadoDetalhe({ chamado }) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge nome={chamado.status} cor={chamado.status_cor} />
          <PrioridadeBadge nome={chamado.prioridade} cor={chamado.prioridade_cor} />
        </div>
        <h3 className="mt-3 text-lg font-semibold">{chamado.titulo}</h3>
      </div>

      <div className="rounded-lg bg-superficie-2 px-4 py-3 text-[15px] whitespace-pre-line">{chamado.descricao}</div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Item rotulo="Solicitante">{chamado.solicitante}</Item>
        <Item rotulo="E-mail">
          {chamado.solicitante_email && (
            <a href={`mailto:${chamado.solicitante_email}`} className="text-primaria hover:underline">
              {chamado.solicitante_email}
            </a>
          )}
        </Item>
        <Item rotulo="Setor">{chamado.setor}</Item>
        <Item rotulo="Responsável">{chamado.responsavel ?? <span className="text-texto-suave">Ninguém assumiu ainda</span>}</Item>
        <Item rotulo="Categoria">{chamado.categoria}</Item>
        <Item rotulo="Aberto em">{formatarDataHora(chamado.data_abertura)}</Item>
        <Item rotulo="Atualizado em">{formatarDataHora(chamado.data_atualizacao)}</Item>
        {chamado.data_encerramento && <Item rotulo="Encerrado em">{formatarDataHora(chamado.data_encerramento)}</Item>}
      </dl>
    </div>
  );
}
