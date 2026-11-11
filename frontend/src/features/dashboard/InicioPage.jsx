import { Link } from "react-router-dom";
import { Ticket, CircleDot, Clock, CheckCircle2, ArrowRight, Flame, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert, EmptyState, LoadingState } from "@/components/ui/States";
import { tempoRelativo } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { StatusBadge, PrioridadeBadge } from "@/features/chamados/components/ChamadoBadges";
import { useDashboard } from "./api";
import { BarrasPorCategoria } from "./BarrasPorCategoria";

/**
 * Tela Início. Números calculados no servidor (GET /api/dashboard);
 * cada card abre a lista de chamados com o mesmo filtro que gerou o número.
 */
export function InicioPage() {
  const { usuario, ehAdmin } = useAuth();
  const dashboard = useDashboard();
  const d = dashboard.data;
  const carregando = dashboard.isPending;

  const cards = [
    { rotulo: ehAdmin ? "Total de chamados" : "Meus chamados", valor: d?.total, icone: Ticket, tom: "primaria", para: "/chamados" },
    { rotulo: "Abertos", valor: d?.por_tipo.aberto, icone: CircleDot, tom: "info", para: "/chamados?tipo=aberto" },
    { rotulo: "Em atendimento", valor: d?.por_tipo.andamento, icone: Clock, tom: "aviso", para: "/chamados?tipo=andamento" },
    { rotulo: "Resolvidos", valor: d?.por_tipo.resolvido, icone: CheckCircle2, tom: "sucesso", para: "/chamados?tipo=resolvido" },
    { rotulo: "Alta prioridade", valor: d?.alta_prioridade, icone: Flame, tom: "perigo", para: "/chamados?alta=1&situacao=ativos" }
  ];

  return (
    <>
      <PageHeader
        titulo={`Olá, ${usuario.nome.split(" ")[0]}!`}
        descricao={ehAdmin ? "Visão geral do atendimento." : "Resumo dos chamados que você abriu."}
      />

      {dashboard.isError && (
        <Alert tom="perigo" titulo="Não foi possível carregar o resumo." className="mb-6">
          {dashboard.error.message}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {cards.map((c, i) => (
          <div key={c.rotulo} className={i === 0 ? "col-span-2 lg:col-span-1" : undefined}>
            <StatCard rotulo={c.rotulo} valor={c.valor ?? 0} icone={c.icone} tom={c.tom} para={c.para} carregando={carregando} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-texto-suave">Alta prioridade conta só os chamados ainda não encerrados.</p>

      {/* Fila do administrador */}
      {ehAdmin && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <FilaCard
            icone={UserCheck}
            titulo="Meus atendimentos"
            descricao="Chamados em aberto sob sua responsabilidade."
            valor={d?.meus_atendimentos}
            para="/chamados?responsavel=eu&situacao=ativos"
            carregando={carregando}
          />
          <FilaCard
            icone={UserX}
            titulo="Sem responsável"
            descricao="Chamados em aberto que ninguém assumiu ainda."
            valor={d?.sem_responsavel}
            para="/chamados?responsavel=nenhum&situacao=ativos"
            carregando={carregando}
            destaque={d?.sem_responsavel > 0}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader titulo="Chamados por categoria" descricao={ehAdmin ? "Todos os chamados, de todas as situações." : "Todos os seus chamados."} />
          <div className="p-5">{carregando ? <LoadingState /> : <BarrasPorCategoria dados={d?.por_categoria ?? []} />}</div>
        </Card>

        <Card>
          <CardHeader
            titulo="Chamados recentes"
            descricao={ehAdmin ? "Os últimos pedidos abertos." : "Seus pedidos mais recentes."}
            acoes={
              <Link to="/chamados" className="flex items-center gap-1 text-sm font-medium text-primaria hover:underline">
                Ver todos <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          {carregando ? (
            <LoadingState />
          ) : !d?.recentes.length ? (
            <EmptyState titulo="Nenhum chamado ainda" descricao={ehAdmin ? undefined : "Use o menu Meus chamados para abrir o primeiro."} />
          ) : (
            <ul>
              {d.recentes.map((c) => (
                <li key={c.id} className="border-b border-borda last:border-0">
                  <Link to={`/chamados?chamado=${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-superficie-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        <span className="mr-2 tabular-nums text-texto-suave">#{c.id}</span>
                        {c.titulo}
                      </p>
                      <p className="text-sm text-texto-suave">
                        {ehAdmin && `${c.solicitante} · `}
                        {tempoRelativo(c.data_abertura)}
                        {c.responsavel && ` · ${c.responsavel}`}
                      </p>
                    </div>
                    <div className="hidden gap-2 sm:flex">
                      <PrioridadeBadge nome={c.prioridade} cor={c.prioridade_cor} />
                      <StatusBadge nome={c.status} cor={c.status_cor} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function FilaCard({ icone: Icone, titulo, descricao, valor, para, carregando, destaque }) {
  return (
    <Link
      to={para}
      className="flex items-center gap-4 rounded-xl border border-borda bg-superficie p-4 shadow-cartao transition-colors hover:border-primaria"
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${destaque ? "bg-aviso-suave text-aviso" : "bg-superficie-2 text-texto-suave"}`}>
        <Icone className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{titulo}</p>
        <p className="text-sm text-texto-suave">{descricao}</p>
      </div>
      <span className="text-2xl font-semibold tabular-nums">
        {carregando ? <span className="inline-block h-7 w-8 animate-pulse rounded bg-superficie-2" /> : (valor ?? 0)}
      </span>
    </Link>
  );
}
