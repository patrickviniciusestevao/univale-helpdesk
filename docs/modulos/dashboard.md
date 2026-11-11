# Dashboard

> Código:
> - backend: `backend/src/modules/dashboard/` (routes, service, repository — 4.6, R-010); usa `montarFiltro` de `chamados.repository`;
> - frontend: `frontend/src/features/dashboard/` (`InicioPage`, `BarrasPorCategoria`, `api.js`).
>
> Etapa **4.6** (R-010). Fonte: pedido do dono em 2026-11-11 (R-000). Índice geral: [../SPEC.md](../SPEC.md).

## Para que serve
Mostrar, logo ao entrar, como está o atendimento: quanto tem para fazer, o que é urgente e o que chegou por último.

## Como funciona (processo)
- **Administrador:** indicadores de **todos** os chamados + a sua fila ("Meus atendimentos", "Sem responsável").
- **Usuário comum:** os mesmos indicadores, só dos chamados que ele abriu.
- **Cada número é um link** para a lista de chamados com o filtro que gerou o número (ex.: "Alta prioridade" → `/chamados?alta=1&situacao=ativos`).

## Indicadores
| Card / bloco | Regra | Link |
|---|---|---|
| Total de chamados | todos (ou os meus) | `/chamados` |
| Abertos | status do tipo Aberto | `?tipo=aberto` |
| Em atendimento | status do tipo Em andamento | `?tipo=andamento` |
| Resolvidos | status do tipo Resolvido | `?tipo=resolvido` |
| Alta prioridade | maior nível entre as prioridades ativas **e** não encerrado | `?alta=1&situacao=ativos` |
| Meus atendimentos (admin) | responsável = eu e não encerrado | `?responsavel=eu&situacao=ativos` |
| Sem responsável (admin) | sem responsável e não encerrado (fica amarelo quando > 0) | `?responsavel=nenhum&situacao=ativos` |
| Chamados por categoria | contagem de todos os chamados por categoria, barras horizontais | `?categoria=<id>` |
| Chamados recentes | os 6 mais recentes | abre o chamado |

## Regras de negócio
- **Contas feitas no servidor** (`GET /api/dashboard`) com os **mesmos filtros** da lista de chamados. *(R-010, resolve B-14/B-26)*
- **Não depende do nome** do status/prioridade, e sim do **tipo** do status e do **nível** da prioridade (cadastros). *(R-006)*

## Exemplos do dono
> Dados de teste: Total 4 · Abertos 2 · Em atendimento 1 · Resolvidos 1 · Alta prioridade 2 (ambos abertos).

## Perguntas em aberto
- [x] Usuário comum tem dashboard? → **sim, só dos chamados dele** (R-002/R-010)
- [ ] Filtro de período no dashboard (hoje, 7 dias, mês)? — futuro
- [ ] Tempo médio de atendimento (abertura → encerramento)? — possível com `data_encerramento`; futuro
