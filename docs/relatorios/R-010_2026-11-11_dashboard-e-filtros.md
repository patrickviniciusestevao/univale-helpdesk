# R-010 — Dashboard e filtros

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.6 — Dashboard e filtros |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11) |

## Pedido
"Feito, prossiga" — migração 004 executada, 4.5 validada, início da 4.6: dashboard com as contas no servidor (total, abertos, em
atendimento, resolvidos, alta prioridade, por categoria, recentes), filtros por setor e responsável e paginação.

## O que foi feito
**Banco:** nenhuma migração. Migração 004 marcada como **Executada** (local, 2026-11-11).

**Backend**
- `chamados.repository`: `montarFiltro` (busca por nº ou texto no título/descrição/solicitante, status, tipo de status, situação
  ativos/encerrados, prioridade, categoria, setor, responsável id/"nenhum", alta prioridade) e `listar` **paginado** com contagem total;
  `FROM_CHAMADO` reaproveitado na contagem e no dashboard.
- `chamados.routes`: validação dos filtros da lista (mensagens em português); `responsavel=eu` vira o usuário logado no service;
  resposta com `meta: { total, pagina, por_pagina, paginas }`.
- `modules/dashboard/` (novo): `GET /api/dashboard` — total, por tipo de status, alta prioridade (não encerrados), por categoria,
  6 recentes; para o admin, também "meus atendimentos" e "sem responsável". Usa os **mesmos filtros** da lista.

**Frontend**
- `ChamadosPage`: filtros e paginação **no servidor** (busca espera 350 ms após a digitação); novos filtros **Situação** (em aberto /
  encerrados), **Setor** e **Responsável** (meus atendimentos, sem responsável, cada admin) — os dois últimos só para o admin; etiquetas
  removíveis para os filtros que vêm dos cards ("Tipo de status: Aberto", "Alta prioridade"); "Limpar filtros"; lista anterior fica na tela
  (esmaecida) enquanto a nova carrega; paginação de 20 em 20 (`components/ui/Paginacao.jsx`, novo).
- `InicioPage` reescrita com `useDashboard`: 5 cards (Total, Abertos, Em atendimento, Resolvidos, **Alta prioridade**), fila do admin
  (**Meus atendimentos**, **Sem responsável** — amarelo quando há chamado esperando), **Chamados por categoria** e recentes; todo número
  abre a lista com o filtro correspondente.
- `BarrasPorCategoria.jsx` (novo): barras horizontais em HTML + Tailwind — uma série, cor primária, barra fina com ponta arredondada,
  número e % em cor de texto, linha clicável e detalhe ao passar o mouse.
- `chamados/api.js`: `useChamados(filtros)` paginado; gravações também atualizam o dashboard. `dashboard/api.js` (novo).

**Docs:** `roadmap.md` (4.5 validada, 4.6 concluída), `decisoes.md` (5), `backlog.md` (B-14, B-22, B-26 resolvidos), `SPEC.md`,
`modulos/dashboard.md` (reescrito), `backend/README.md`, `frontend/README.md`; R-009 validado.

## Decisões tomadas
- Cada número do dashboard usa exatamente o filtro da lista que o card abre (não há duas contas diferentes para a mesma coisa).
- "Por categoria" conta todos os chamados (de todas as situações).

## Ação necessária do dono
- [ ] Reiniciar a API e testar:
  - **Início (admin):** conferir os números; clicar em cada card (Abertos, Alta prioridade, Meus atendimentos, Sem responsável, uma barra de
    categoria) → a lista abre já filtrada e com o mesmo total;
  - **Chamados:** buscar por "#3", por um trecho do título e pelo nome do solicitante; combinar Situação + Setor + Responsável;
    "Limpar filtros"; se tiver mais de 20 chamados, usar Anterior/Próxima;
  - **Início (João):** só os números dele, sem a fila do admin.
- [ ] Validar a 4.6. Com ela, as funcionalidades do pedido inicial estão completas. Próxima fase proposta: **5.1 Pré-deploy (segurança)** —
  limite de tentativas de login, cabeçalhos de segurança (`helmet`), limpeza de sessões vencidas, revisão do `.env` e de
  `docs/seguranca.md`. Ou, se preferir antes, ideias do backlog futuro (anexos, e-mail de aviso, tempo médio de atendimento).

## Pendências / próximos passos
- 5.1 Pré-deploy: segurança.

## Verificação realizada
- `node --check` em todo o backend; `npm run build` do frontend — ok.
- `montarFiltro` conferido para 5 combinações (SQL e parâmetros corretos, sempre com `?`); validação dos filtros na rota (situação,
  responsável, por página, tipo, página inválidos → 400 em português) — ok.
- Service do dashboard com dados falsos: formato da resposta e filtros de cada número corretos para admin e usuário comum — ok.
- **Não testado:** consultas no MySQL real e as telas no navegador (inclusive o visual do gráfico por categoria).
