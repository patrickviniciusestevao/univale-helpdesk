# Cadastros auxiliares

> Código:
> - backend: `backend/src/modules/cadastros/` — `cadastros.tipos.js` (configuração de cada lista), routes, controller, service, repository (Fase 2 e 4.3);
> - frontend: `frontend/src/features/cadastros/` — `CadastrosPage`, `CadastroForm`, `config.js`, `api.js` (4.3).
> - banco: `categorias`, `prioridades`, `status_chamados` (schema.sql), `setores` (migração 001), marcadores (migração 003).
>
> Etapas **2** (leitura) e **4.3** (manutenção, R-006). Fonte: pedido do dono em 2026-11-11 (R-000). Índice geral: [../SPEC.md](../SPEC.md).

## Para que serve
Manter as listas que classificam os chamados — **categorias, prioridades, status e setores** — sem precisar mexer no código ou no banco.

## Como funciona (processo)
1. O administrador abre **Administração › Cadastros** e escolhe a aba (Categorias, Prioridades, Status, Setores).
2. Vê todos os itens (inativos em cinza, com a etiqueta "Inativo"); cria, edita e **desativa/reativa**.
3. Os formulários e filtros de chamado mostram só os itens **ativos** (mais o valor atual de um chamado antigo, marcado "desativado").

## Regras de negócio
- **Não se apaga cadastro, desativa-se.** Item usado por chamados antigos continua aparecendo neles. Não existe DELETE. *(R-006)*
- **Nome único** em cada lista (chave única do banco; repetir dá "Já existe um registro com esse valor."). *(existe)*
- **Tipo do status** diz o que ele significa para as regras — o nome pode ser qualquer um *(R-006)*:
  - **Aberto** — ainda não começou: o solicitante pode editar e cancelar;
  - **Em andamento** — a equipe está atendendo;
  - **Resolvido** — encerrado com solução;
  - **Cancelado** — encerrado sem solução; o botão "Cancelar chamado" usa o primeiro status ativo desse tipo (pela ordem).
- **Status inicial:** exatamente **um**, **ativo** e do tipo **Aberto**; todo chamado novo nasce com ele. Marcar outro como inicial desmarca o
  anterior. O inicial atual não pode ser desmarcado nem desativado. *(R-006)*
- **Prioridade com nível** (1 a 9): 1 = mais baixa; o maior nível é a "alta prioridade" do dashboard; o nível também ordena a lista. *(R-006)*
- **Cor** de status e prioridade escolhida entre as cores do tema (Cinza, Roxo, Azul, Verde, Amarelo, Vermelho) — vale no tema claro e no escuro. *(R-006)*
- **Ordem** do status define a posição nas listas e filtros. *(R-006)*

## Exemplos do dono
> Setores: Financeiro, Secretaria, Biblioteca, Laboratório, Coordenação, TI.
> Status iniciais: Aberto (tipo Aberto, inicial, azul) · Em atendimento (Em andamento, amarelo) · Resolvido (Resolvido, verde) · Cancelado (Cancelado, cinza).
> Exemplo de uso: o admin cria "Aguardando peça" (tipo Em andamento, amarelo, ordem 3) — os chamados nesse status contam como "Em atendimento"
> no dashboard e o solicitante não consegue mais editá-los.

## Dados
| O quê | Onde fica (tabela/campo) | Observação |
|---|---|---|
| Categorias | `categorias` (id, nome, ativo) | |
| Prioridades | `prioridades` (id, nome, nivel, cor, ativo) | migração 003 |
| Status | `status_chamados` (id, nome, tipo, inicial, cor, ordem, ativo) | migração 003; `chamados.status_id` sem DEFAULT |
| Setores | `setores` (id, nome, ativo) | migração 001 |

## Rotas
| Método e rota | Quem | O quê |
|---|---|---|
| `GET /api/cadastros/:tipo?ativos=1` | logado | lista para formulários e filtros |
| `POST /api/cadastros/:tipo` | admin | criar |
| `PATCH /api/cadastros/:tipo/:id` | admin | editar / ativar / desativar |

## Perguntas em aberto
- [x] Campos extras de status e prioridade → aprovados; "encerra" virou **tipo** (R-006)
- [x] Status "Cancelado" → criado na migração 002 (R-005)
