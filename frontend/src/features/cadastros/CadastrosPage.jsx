import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Alert, EmptyState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { plural } from "@/lib/format";
import { useCadastro, useSalvarCadastro } from "./api";
import { ABAS, rotuloTipoStatus } from "./config";
import { CadastroForm } from "./CadastroForm";

const FORM_ID = "form-cadastro";

/**
 * Manutenção dos cadastros auxiliares (só administrador).
 * Aba e modal ficam na URL: /cadastros?tipo=status&item=3  ·  /cadastros?tipo=setores&novo=1
 */
export function CadastrosPage() {
  const [params, setParams] = useSearchParams();
  const aba = ABAS.find((a) => a.tipo === params.get("tipo")) ?? ABAS[0];
  const tipo = aba.tipo;
  const toast = useToast();

  const lista = useCadastro(tipo);
  const salvar = useSalvarCadastro(tipo); // formulário do modal
  const alternar = useSalvarCadastro(tipo); // botão Desativar/Reativar

  const idItem = params.get("item");
  const novo = params.get("novo") === "1";
  const itemAberto = idItem ? lista.data?.find((i) => i.id === Number(idItem)) : null;

  const irPara = (mudancas) => {
    const p = new URLSearchParams({ tipo });
    for (const [k, v] of Object.entries(mudancas)) if (v) p.set(k, v);
    setParams(p);
  };
  const fecharModal = () => {
    salvar.reset();
    irPara({});
  };

  function alternarAtivo(item) {
    alternar.mutate(
      { id: item.id, dados: { ativo: !item.ativo } },
      { onSuccess: (r) => toast.sucesso(r.message), onError: (e) => toast.erro(e.message) }
    );
  }

  const ativos = lista.data?.filter((i) => i.ativo).length ?? 0;

  return (
    <>
      <PageHeader
        titulo="Cadastros"
        descricao="Listas usadas nos chamados. Itens não são apagados: desative o que não usa mais."
        acoes={
          <Button onClick={() => irPara({ novo: "1" })}>
            <Plus className="size-4" aria-hidden />
            Novo {aba.singular}
          </Button>
        }
      />

      {/* Abas */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-xl border border-borda bg-superficie p-1 shadow-cartao">
          {ABAS.map(({ tipo: t, rotulo, icone: Icone }) => (
            <button
              key={t}
              onClick={() => setParams({ tipo: t })}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                t === tipo ? "bg-primaria-suave text-primaria" : "text-texto-suave hover:bg-superficie-2 hover:text-texto"
              )}
            >
              <Icone className="size-4" aria-hidden />
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="border-b border-borda px-5 py-4">
          <h2 className="font-semibold">{aba.rotulo}</h2>
          <p className="mt-0.5 text-sm text-texto-suave">{aba.descricao}</p>
        </div>

        {lista.isPending ? (
          <LoadingState />
        ) : lista.isError ? (
          <div className="p-5">
            <Alert tom="perigo">{lista.error.message}</Alert>
          </div>
        ) : lista.data.length === 0 ? (
          <EmptyState titulo={`Nada cadastrado em ${aba.rotulo}`} />
        ) : (
          <>
            <ul>
              {lista.data.map((item) => (
                <li
                  key={item.id}
                  className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-borda px-5 py-3 last:border-0", !item.ativo && "bg-superficie-2/50")}
                >
                  <div className={cn("min-w-0 flex-1", !item.ativo && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-2">
                      {tipo === "status" || tipo === "prioridades" ? (
                        <Badge tom={item.cor} ponto={tipo === "status"}>
                          {item.nome}
                        </Badge>
                      ) : (
                        <span className="font-medium">{item.nome}</span>
                      )}
                      {item.inicial && (
                        <Badge tom="primaria" ponto={false}>
                          <Star className="size-3" aria-hidden /> Inicial
                        </Badge>
                      )}
                      {!item.ativo && <Badge ponto={false}>Inativo</Badge>}
                    </div>
                    {tipo === "status" && (
                      <p className="mt-1 text-sm text-texto-suave">
                        Tipo: {rotuloTipoStatus(item.tipo)} · Ordem {item.ordem}
                      </p>
                    )}
                    {tipo === "prioridades" && <p className="mt-1 text-sm text-texto-suave">Nível {item.nivel}</p>}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variante="fantasma"
                      tamanho="sm"
                      onClick={() => alternarAtivo(item)}
                      disabled={item.inicial || alternar.isPending}
                      title={item.inicial ? "O status inicial não pode ser desativado" : undefined}
                    >
                      {item.ativo ? "Desativar" : "Reativar"}
                    </Button>
                    <Button variante="secundaria" tamanho="sm" onClick={() => irPara({ item: String(item.id) })}>
                      <Pencil className="size-3.5" aria-hidden />
                      Editar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="border-t border-borda px-5 py-3 text-sm text-texto-suave">
              {plural(lista.data.length, "item", "itens")} · {plural(ativos, "ativo")}
            </p>
          </>
        )}
      </Card>

      {(novo || itemAberto) && (
        <Modal
          key={`${tipo}-${idItem ?? "novo"}`}
          aberto
          onFechar={fecharModal}
          titulo={novo ? `Novo ${aba.singular}` : `Editar ${aba.singular}`}
          rodape={
            <>
              <Button variante="secundaria" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button type="submit" form={FORM_ID} carregando={salvar.isPending}>
                Salvar
              </Button>
            </>
          }
        >
          <CadastroForm
            formId={FORM_ID}
            tipo={tipo}
            item={itemAberto}
            erro={salvar.error}
            onSalvar={(dados) =>
              salvar.mutate(
                { id: itemAberto?.id, dados },
                {
                  onSuccess: (r) => {
                    toast.sucesso(r.message);
                    fecharModal();
                  }
                }
              )
            }
          />
        </Modal>
      )}
    </>
  );
}
