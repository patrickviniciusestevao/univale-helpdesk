import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, X, Ticket, SearchX } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { Table, Th, Tr, Td } from "@/components/ui/Table";
import { Paginacao } from "@/components/ui/Paginacao";
import { Alert, EmptyState, LoadingState } from "@/components/ui/States";
import { formatarData, plural } from "@/lib/format";
import { PERFIS } from "@/lib/perfis";
import { useCadastro } from "@/features/cadastros/api";
import { rotuloTipoStatus } from "@/features/cadastros/config";
import { useUsuarios } from "@/features/usuarios/api";
import { useAuth } from "@/features/auth/AuthContext";
import { useChamados } from "./api";
import { StatusBadge, PrioridadeBadge } from "./components/ChamadoBadges";
import { ChamadoModal } from "./components/ChamadoModal";

const POR_PAGINA = 20;

// Filtros na URL (nome curto) → parâmetro da API. Ex.: /chamados?situacao=ativos&responsavel=eu&pagina=2
const FILTROS = {
  busca: "busca",
  situacao: "situacao",
  status: "status_id",
  tipo: "tipo",
  prioridade: "prioridade_id",
  categoria: "categoria_id",
  setor: "setor_id",
  responsavel: "responsavel",
  alta: "alta"
};

export function ChamadosPage() {
  const [params, setParams] = useSearchParams();
  const { usuario, ehAdmin } = useAuth();

  const filtros = Object.fromEntries(Object.keys(FILTROS).map((f) => [f, params.get(f) ?? ""]));
  const pagina = Number(params.get("pagina")) || 1;
  const temFiltro = Object.values(filtros).some(Boolean);

  // Muda parâmetros da URL. Mudar filtro volta para a página 1.
  function alterarParams(mudancas, { replace = false, manterPagina = false } = {}) {
    const novos = new URLSearchParams(params);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor === null || valor === undefined || valor === "") novos.delete(chave);
      else novos.set(chave, valor);
    }
    if (!manterPagina && !("pagina" in mudancas)) novos.delete("pagina");
    setParams(novos, { replace });
  }
  const limparFiltros = () => alterarParams(Object.fromEntries(Object.keys(FILTROS).map((f) => [f, null])));

  // Busca: espera a pessoa parar de digitar (350 ms) antes de consultar a API.
  const [textoBusca, setTextoBusca] = useState(filtros.busca);
  useEffect(() => setTextoBusca(filtros.busca), [filtros.busca]);
  useEffect(() => {
    if (textoBusca === filtros.busca) return;
    // Sem trim aqui (comeria o espaço enquanto a pessoa digita "impressora travada"); a API já limpa.
    const espera = setTimeout(() => alterarParams({ busca: textoBusca }, { replace: true }), 350);
    return () => clearTimeout(espera);
  }, [textoBusca]); // eslint-disable-line react-hooks/exhaustive-deps

  const consultaApi = Object.fromEntries(Object.entries(FILTROS).map(([url, apiNome]) => [apiNome, filtros[url]]));
  const chamados = useChamados({ ...consultaApi, pagina, por_pagina: POR_PAGINA });
  const status = useCadastro("status");
  const prioridades = useCadastro("prioridades");
  const categorias = useCadastro("categorias");
  const setores = useCadastro("setores");
  const usuarios = useUsuarios({ enabled: ehAdmin });
  const administradores = (usuarios.data ?? []).filter((u) => u.perfil === PERFIS.ADMIN && u.ativo);

  const lista = chamados.data?.data ?? [];
  const meta = chamados.data?.meta;

  // Modal
  const idAberto = params.get("chamado");
  const modo = params.get("novo") === "1" ? "novo" : idAberto ? (params.get("editar") === "1" ? "editar" : "ver") : null;
  const abrir = (id) => alterarParams({ chamado: id, editar: null, novo: null }, { manterPagina: true });
  const fecharModal = () => alterarParams({ chamado: null, editar: null, novo: null }, { manterPagina: true });

  return (
    <>
      <PageHeader
        titulo={ehAdmin ? "Chamados" : "Meus chamados"}
        descricao={ehAdmin ? "Todos os pedidos de suporte: acompanhe, filtre e gerencie." : "Os pedidos de suporte que você abriu."}
        acoes={
          <Button onClick={() => alterarParams({ novo: "1", chamado: null, editar: null }, { manterPagina: true })}>
            <Plus className="size-4" aria-hidden />
            Abrir chamado
          </Button>
        }
      />

      {/* Barra de filtros */}
      <Card className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-suave" aria-hidden />
            <Input
              value={textoBusca}
              onChange={(e) => setTextoBusca(e.target.value)}
              placeholder={ehAdmin ? "Buscar por nº, título, descrição ou solicitante..." : "Buscar por nº, título ou descrição..."}
              className="pl-9"
              aria-label="Buscar chamados"
            />
          </div>
          <Select value={filtros.situacao} onChange={(e) => alterarParams({ situacao: e.target.value })} aria-label="Situação">
            <option value="">Todas as situações</option>
            <option value="ativos">Em aberto (aguardando ou em atendimento)</option>
            <option value="encerrados">Encerrados (resolvidos ou cancelados)</option>
          </Select>
          <FiltroSelect rotulo="Todos os status" valor={filtros.status} opcoes={status.data} onChange={(v) => alterarParams({ status: v })} />
          <FiltroSelect rotulo="Todas as prioridades" valor={filtros.prioridade} opcoes={prioridades.data} onChange={(v) => alterarParams({ prioridade: v })} />
          <FiltroSelect rotulo="Todas as categorias" valor={filtros.categoria} opcoes={categorias.data} onChange={(v) => alterarParams({ categoria: v })} />
          {ehAdmin && (
            <>
              <FiltroSelect rotulo="Todos os setores" valor={filtros.setor} opcoes={setores.data} onChange={(v) => alterarParams({ setor: v })} />
              <Select value={filtros.responsavel} onChange={(e) => alterarParams({ responsavel: e.target.value })} aria-label="Responsável">
                <option value="">Qualquer responsável</option>
                <option value="eu">Meus atendimentos</option>
                <option value="nenhum">Sem responsável</option>
                {administradores
                  .filter((a) => a.id !== usuario.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
              </Select>
            </>
          )}
        </div>

        {/* Filtros que vêm dos cards da tela Início e não têm campo próprio */}
        {(filtros.tipo || filtros.alta || temFiltro) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filtros.tipo && (
              <FiltroAtivo onRemover={() => alterarParams({ tipo: null })}>Tipo de status: {rotuloTipoStatus(filtros.tipo)}</FiltroAtivo>
            )}
            {filtros.alta && <FiltroAtivo onRemover={() => alterarParams({ alta: null })}>Alta prioridade</FiltroAtivo>}
            {temFiltro && (
              <Button variante="fantasma" tamanho="sm" onClick={limparFiltros}>
                <X className="size-4" aria-hidden />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </Card>

      {chamados.isPending ? (
        <Card>
          <LoadingState texto="Carregando chamados..." />
        </Card>
      ) : chamados.isError ? (
        <Alert
          tom="perigo"
          titulo="Não foi possível carregar os chamados."
          acao={
            <Button tamanho="sm" variante="secundaria" onClick={() => chamados.refetch()}>
              Tentar de novo
            </Button>
          }
        >
          {chamados.error.message}
        </Alert>
      ) : (
        <>
          <p className="mb-3 text-sm text-texto-suave">
            {temFiltro ? plural(meta.total, "chamado encontrado", "chamados encontrados") : plural(meta.total, "chamado")}
            {chamados.isFetching && " · atualizando..."}
          </p>

          {lista.length === 0 ? (
            <Card>
              {temFiltro ? (
                <EmptyState icone={SearchX} titulo="Nenhum chamado encontrado" descricao="Tente outro termo ou limpe os filtros." />
              ) : (
                <EmptyState
                  icone={Ticket}
                  titulo="Nenhum chamado ainda"
                  descricao={ehAdmin ? "Quando alguém abrir um chamado, ele aparece aqui." : "Precisa de ajuda? Abra um chamado e acompanhe por aqui."}
                  acao={<Button onClick={() => alterarParams({ novo: "1" }, { manterPagina: true })}>Abrir o primeiro chamado</Button>}
                />
              )}
            </Card>
          ) : (
            <>
              {/* Computador: tabela */}
              <Card className={`hidden overflow-hidden md:block ${chamados.isPlaceholderData ? "opacity-60" : ""}`}>
                <Table>
                  <thead>
                    <tr>
                      <Th className="w-16">Nº</Th>
                      <Th>Chamado</Th>
                      {ehAdmin && <Th>Setor</Th>}
                      {ehAdmin && <Th>Responsável</Th>}
                      <Th>Prioridade</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Abertura</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((c) => (
                      <Tr key={c.id} onClick={() => abrir(c.id)}>
                        <Td className="tabular-nums text-texto-suave">#{c.id}</Td>
                        <Td>
                          <p className="font-medium">{c.titulo}</p>
                          <p className="text-sm text-texto-suave">{ehAdmin ? `${c.solicitante} · ${c.categoria}` : c.categoria}</p>
                        </Td>
                        {ehAdmin && <Td className="text-texto-suave">{c.setor ?? "—"}</Td>}
                        {ehAdmin && <Td className={c.responsavel ? undefined : "text-texto-suave"}>{c.responsavel ?? "—"}</Td>}
                        <Td>
                          <PrioridadeBadge nome={c.prioridade} cor={c.prioridade_cor} />
                        </Td>
                        <Td>
                          <StatusBadge nome={c.status} cor={c.status_cor} />
                        </Td>
                        <Td className="text-right tabular-nums text-texto-suave">{formatarData(c.data_abertura)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Card>

              {/* Celular: cartões */}
              <div className={`flex flex-col gap-3 md:hidden ${chamados.isPlaceholderData ? "opacity-60" : ""}`}>
                {lista.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => abrir(c.id)}
                    className="cursor-pointer rounded-xl border border-borda bg-superficie p-4 text-left shadow-cartao active:bg-superficie-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm text-texto-suave">
                      <span className="tabular-nums">#{c.id}</span>
                      <span className="tabular-nums">{formatarData(c.data_abertura)}</span>
                    </div>
                    <p className="mt-1 font-medium">{c.titulo}</p>
                    <p className="text-sm text-texto-suave">
                      {ehAdmin ? `${c.solicitante} · ${c.categoria}` : c.categoria}
                      {c.responsavel && ` · Atendido por ${c.responsavel}`}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge nome={c.status} cor={c.status_cor} />
                      <PrioridadeBadge nome={c.prioridade} cor={c.prioridade_cor} />
                    </div>
                  </button>
                ))}
              </div>

              <Paginacao
                pagina={meta.pagina}
                paginas={meta.paginas}
                total={meta.total}
                porPagina={meta.por_pagina}
                carregando={chamados.isFetching}
                onMudar={(p) => {
                  alterarParams({ pagina: p > 1 ? String(p) : null });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </>
      )}

      {modo && (
        <ChamadoModal
          // key: troca de chamado = modal novo (sem estado do anterior)
          key={`${modo === "novo" ? "novo" : idAberto}`}
          modo={modo}
          id={idAberto ? Number(idAberto) : null}
          onFechar={fecharModal}
          onVer={() => alterarParams({ editar: null }, { manterPagina: true })}
          onEditar={() => alterarParams({ editar: "1" }, { manterPagina: true })}
        />
      )}
    </>
  );
}

function FiltroSelect({ rotulo, valor, opcoes = [], onChange }) {
  return (
    <Select value={valor} onChange={(e) => onChange(e.target.value)} aria-label={rotulo}>
      <option value="">{rotulo}</option>
      {opcoes.map((item) => (
        <option key={item.id} value={item.id}>
          {item.nome}
          {!item.ativo && " (desativado)"}
        </option>
      ))}
    </Select>
  );
}

function FiltroAtivo({ children, onRemover }) {
  return (
    <Badge tom="primaria" ponto={false} className="gap-1 py-1 pr-1">
      {children}
      <button onClick={onRemover} className="cursor-pointer rounded-full p-0.5 hover:bg-primaria/15" aria-label="Remover filtro">
        <X className="size-3" />
      </button>
    </Badge>
  );
}
