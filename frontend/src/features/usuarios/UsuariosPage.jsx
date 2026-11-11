import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, X, UserX, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Table, Th, Tr, Td } from "@/components/ui/Table";
import { Alert, EmptyState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { plural, tempoRelativo } from "@/lib/format";
import { PERFIS, ROTULO_PERFIL } from "@/lib/perfis";
import { useAuth } from "@/features/auth/AuthContext";
import { useUsuarios, useSalvarUsuario, useRedefinirSenha } from "./api";
import { UsuarioForm } from "./UsuarioForm";
import { SenhaTemporaria } from "./SenhaTemporaria";

const FORM_ID = "form-usuario";
const FILTROS = ["busca", "perfil", "situacao"];

const normalizar = (t = "") =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function filtrar(usuarios, f) {
  const termo = normalizar(f.busca.trim());
  return usuarios.filter(
    (u) =>
      (!termo || normalizar(`${u.nome} ${u.email} ${u.setor ?? ""}`).includes(termo)) &&
      (!f.perfil || u.perfil === f.perfil) &&
      (!f.situacao || (f.situacao === "ativos" ? u.ativo : !u.ativo))
  );
}

function Situacao({ usuario }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tom={usuario.ativo ? "sucesso" : "neutro"}>{usuario.ativo ? "Ativo" : "Inativo"}</Badge>
      {usuario.ativo && usuario.trocar_senha && (
        <Badge tom="aviso" ponto={false}>
          Senha temporária
        </Badge>
      )}
    </div>
  );
}

const PerfilBadge = ({ perfil }) => (
  <Badge tom={perfil === PERFIS.ADMIN ? "primaria" : "neutro"} ponto={false}>
    {ROTULO_PERFIL[perfil]}
  </Badge>
);

const ultimoAcesso = (u) => (u.ultimo_acesso ? tempoRelativo(u.ultimo_acesso) : "Nunca entrou");

/**
 * Gestão de usuários (só administrador). Filtros e modal na URL: /usuarios?perfil=admin&usuario=3
 */
export function UsuariosPage() {
  const [params, setParams] = useSearchParams();
  const { usuario: eu } = useAuth();
  const toast = useToast();
  const usuarios = useUsuarios();
  const salvar = useSalvarUsuario();
  const redefinir = useRedefinirSenha();
  const [senhaGerada, setSenhaGerada] = useState(null); // { usuario, senha } — mostrada uma vez
  const [confirmandoSenha, setConfirmandoSenha] = useState(false);

  const filtros = Object.fromEntries(FILTROS.map((f) => [f, params.get(f) ?? ""]));
  const temFiltro = FILTROS.some((f) => filtros[f]);
  const lista = filtrar(usuarios.data ?? [], filtros);

  function alterarParams(mudancas, opcoes) {
    const novos = new URLSearchParams(params);
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null || v === undefined || v === "") novos.delete(k);
      else novos.set(k, v);
    }
    setParams(novos, opcoes);
  }

  const idAberto = params.get("usuario");
  const novo = params.get("novo") === "1";
  const aberto = idAberto ? usuarios.data?.find((u) => u.id === Number(idAberto)) : null;
  const eleMesmo = aberto?.id === eu.id;

  function fecharModal() {
    salvar.reset();
    setConfirmandoSenha(false);
    alterarParams({ usuario: null, novo: null });
  }

  function aoSalvar(dados) {
    salvar.mutate(
      { id: aberto?.id, dados },
      {
        onSuccess: (r) => {
          toast.sucesso(r.message);
          fecharModal();
          if (r.data.senha_temporaria) setSenhaGerada({ usuario: r.data.usuario, senha: r.data.senha_temporaria });
        }
      }
    );
  }

  function aoRedefinir() {
    redefinir.mutate(aberto.id, {
      onSuccess: (r) => {
        toast.sucesso(r.message);
        fecharModal();
        setSenhaGerada({ usuario: r.data.usuario, senha: r.data.senha_temporaria });
      },
      onError: (e) => toast.erro(e.message)
    });
  }

  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao="Quem acessa o helpdesk. Usuários não são apagados: desative quem saiu."
        acoes={
          <Button onClick={() => alterarParams({ novo: "1", usuario: null })}>
            <Plus className="size-4" aria-hidden />
            Novo usuário
          </Button>
        }
      />

      <Card className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-suave" aria-hidden />
            <Input
              value={filtros.busca}
              onChange={(e) => alterarParams({ busca: e.target.value }, { replace: true })}
              placeholder="Buscar por nome, e-mail ou setor..."
              className="pl-9"
              aria-label="Buscar usuários"
            />
          </div>
          <Select value={filtros.perfil} onChange={(e) => alterarParams({ perfil: e.target.value })} aria-label="Perfil">
            <option value="">Todos os perfis</option>
            {Object.values(PERFIS).map((p) => (
              <option key={p} value={p}>
                {ROTULO_PERFIL[p]}
              </option>
            ))}
          </Select>
          <Select value={filtros.situacao} onChange={(e) => alterarParams({ situacao: e.target.value })} aria-label="Situação">
            <option value="">Todas as situações</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </Select>
          {temFiltro && (
            <Button variante="fantasma" onClick={() => alterarParams({ busca: null, perfil: null, situacao: null })}>
              <X className="size-4" aria-hidden />
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {usuarios.isPending ? (
        <Card>
          <LoadingState texto="Carregando usuários..." />
        </Card>
      ) : usuarios.isError ? (
        <Alert tom="perigo" titulo="Não foi possível carregar os usuários.">
          {usuarios.error.message}
        </Alert>
      ) : (
        <>
          <p className="mb-3 text-sm text-texto-suave">
            {temFiltro ? `${plural(lista.length, "usuário encontrado", "usuários encontrados")} de ${usuarios.data.length}` : plural(usuarios.data.length, "usuário")}
          </p>

          {lista.length === 0 ? (
            <Card>
              <EmptyState icone={UserX} titulo="Nenhum usuário encontrado" descricao="Tente outro termo ou limpe os filtros." />
            </Card>
          ) : (
            <>
              <Card className="hidden overflow-hidden md:block">
                <Table>
                  <thead>
                    <tr>
                      <Th>Usuário</Th>
                      <Th>Perfil</Th>
                      <Th>Setor</Th>
                      <Th>Último acesso</Th>
                      <Th>Situação</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((u) => (
                      <Tr key={u.id} onClick={() => alterarParams({ usuario: u.id, novo: null })} className={u.ativo ? undefined : "opacity-60"}>
                        <Td>
                          <p className="font-medium">
                            {u.nome}
                            {u.id === eu.id && <span className="ml-2 text-sm font-normal text-texto-suave">(você)</span>}
                          </p>
                          <p className="text-sm text-texto-suave">{u.email}</p>
                        </Td>
                        <Td>
                          <PerfilBadge perfil={u.perfil} />
                        </Td>
                        <Td className="text-texto-suave">{u.setor ?? "—"}</Td>
                        <Td className="text-texto-suave">{ultimoAcesso(u)}</Td>
                        <Td>
                          <Situacao usuario={u} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Card>

              <div className="flex flex-col gap-3 md:hidden">
                {lista.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => alterarParams({ usuario: u.id, novo: null })}
                    className="cursor-pointer rounded-xl border border-borda bg-superficie p-4 text-left shadow-cartao active:bg-superficie-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{u.nome}</p>
                        <p className="truncate text-sm text-texto-suave">{u.email}</p>
                      </div>
                      <PerfilBadge perfil={u.perfil} />
                    </div>
                    <p className="mt-2 text-sm text-texto-suave">
                      {u.setor ?? "Sem setor"} · {ultimoAcesso(u)}
                    </p>
                    <div className="mt-3">
                      <Situacao usuario={u} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Criar / editar */}
      {(novo || aberto) && (
        <Modal
          key={idAberto ?? "novo"}
          aberto
          onFechar={fecharModal}
          titulo={novo ? "Novo usuário" : "Editar usuário"}
          descricao={novo ? "O sistema gera uma senha temporária; a pessoa cria a dela no primeiro acesso." : undefined}
          rodape={
            confirmandoSenha ? (
              <>
                <Button variante="secundaria" onClick={() => setConfirmandoSenha(false)}>
                  Voltar
                </Button>
                <Button carregando={redefinir.isPending} onClick={aoRedefinir}>
                  Gerar nova senha
                </Button>
              </>
            ) : (
              <>
                {aberto && !eleMesmo && (
                  <Button variante="fantasma" className="mr-auto" onClick={() => setConfirmandoSenha(true)}>
                    <KeyRound className="size-4" aria-hidden />
                    Redefinir senha
                  </Button>
                )}
                <Button variante="secundaria" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button type="submit" form={FORM_ID} carregando={salvar.isPending}>
                  {novo ? "Criar usuário" : "Salvar"}
                </Button>
              </>
            )
          }
        >
          {confirmandoSenha ? (
            <Alert tom="aviso" titulo={`Redefinir a senha de ${aberto.nome}?`}>
              O sistema gera uma nova senha temporária e encerra as sessões abertas dessa pessoa. Ela vai precisar criar uma senha nova no próximo acesso.
            </Alert>
          ) : (
            <UsuarioForm formId={FORM_ID} usuario={aberto} eleMesmo={eleMesmo} erro={salvar.error} onSalvar={aoSalvar} />
          )}
        </Modal>
      )}

      {/* Senha temporária gerada (mostrada uma vez) */}
      {senhaGerada && (
        <Modal
          aberto
          onFechar={() => setSenhaGerada(null)}
          titulo="Senha temporária"
          tamanho="sm"
          rodape={<Button onClick={() => setSenhaGerada(null)}>Pronto</Button>}
        >
          <SenhaTemporaria usuario={senhaGerada.usuario} senha={senhaGerada.senha} />
        </Modal>
      )}
    </>
  );
}
