# Backlog técnico

> Problemas e melhorias conhecidos (B-NN), com o lugar no código e a etapa que resolve. Números nunca são reutilizados.
> Índice geral: [SPEC.md](SPEC.md). Histórico: [relatorios/](relatorios/README.md).

| ID | Problema | Onde (origem) | Etapa / status |
|---|---|---|---|
| B-01 | Dados do chamado (título, descrição, solicitante) são colocados na página com `innerHTML` sem escapar: um título como `<img src=x onerror=alert(1)>` executa script (XSS) | `frontend/js/ui.js:99`, `frontend/js/modal.js` (R-000) | ✅ 3 (R-003) — front da aula apagado; React escapa por padrão |
| B-02 | Não há login: qualquer pessoa vê, edita e exclui qualquer chamado | `backend/src/routes/chamadoRoutes.js` (R-000) | ✅ 4.1 e 4.2 (R-004, R-005) |
| B-03 | Solicitante e e-mail são texto livre digitado no formulário, sem vínculo com um usuário | `chamados.solicitante/email` (R-000) | ✅ 4.2 (R-005, migração 002) |
| B-04 | Exclusão física do chamado (`DELETE`) — perde o registro; com histórico isso não deve existir para o usuário comum | `chamadoController.excluirChamado` (R-000) | ✅ 4.2 (R-005) — Cancelado + exclusão só admin |
| B-05 | Na criação a API aceita o `status` enviado pelo cliente: dá para abrir um chamado já "Resolvido" | `chamadoController.criarChamado` (R-000) | ✅ 2 (R-002) |
| B-06 | Categoria, prioridade e status trafegam pelo **nome** e não pelo id; renomear um cadastro quebra filtros e chamados antigos no front | `chamadoController.buscarIdPorNome`, `index_aula06v4.html` (R-000) | ✅ 2 e 3 (R-002, R-003) |
| B-07 | Opções de status, prioridade e categoria estão fixas no HTML; não existe rota para listar os cadastros | `index_aula06v4.html`, `modal.js` (R-000) | ✅ 2 e 3 (R-002, R-003) |
| B-08 | `buscarIdPorNome` não confere `ativo`: aceita categoria/prioridade/status desativados | `chamadoController.js` (R-000) | ✅ 2 (R-002) |
| B-09 | Controller faz tudo (SQL, validação, HTTP); consultas duplicadas (`montarConsultaChamados` × `PorId`); validação manual; erro no formato `{ erro }` | `chamadoController.js` (R-000) | ✅ 2 (R-002) |
| B-10 | Se `DB_PASSWORD` estiver vazio, o pool usa a senha `'root'` escondida no código | `backend/src/config/database.js:9` (R-000) | ✅ 2 (R-002) |
| B-11 | `dotenv.config()` chamado depois dos `require` no `server.js` (só funciona porque `database.js` também chama) | `backend/src/server.js` (R-000) | ✅ 2 (R-002) |
| B-12 | `PUT` exige todos os campos; não há atualização parcial (ex.: só mudar o status) | `chamadoController.atualizarChamado` (R-000) | ✅ 2 (R-002) |
| B-13 | `id` da URL não é validado (`/chamados/abc` vai até o banco) | `chamadoRoutes.js` (R-000) | ✅ 2 (R-002) |
| B-14 | Dashboard calculado no navegador comparando nomes fixos ("Aberto", "Em atendimento", "Resolvido") | `frontend/js/ui.js:15` (R-000) | ✅ 4.6 (R-010) |
| B-15 | Toast "Página carregada com sucesso!" a cada carregamento (o próprio material da aula desaconselha) | `frontend/js/script.js` (R-000) | ✅ 3 (R-003) |
| B-16 | Sem prefixo `/api`, sem resposta padrão para rota inexistente (404) e sem tratador de erro global | `backend/src/server.js` (R-000) | ✅ 2 (R-002) |
| B-17 | `schema.sql` começa com `DROP DATABASE helpdesk`: executar por engano apaga tudo. É script de aula (com dados de teste e um `SELECT` no fim), não um dump | `database/schema.sql` (R-000) | ✅ 5.1 — `schema_completo.sql` sem DROP DATABASE (R-011); `schema.sql` da aula mantido pelo dono |
| B-18 | A API devolve só `dataAbertura` já formatada (`dd/mm/aaaa`); não devolve `data_atualizacao` nem a data em formato ISO para o front formatar | `chamadoController.js` (R-000) | ✅ 2 (R-002) |
| B-19 | `status_id DEFAULT 1` depende de "Aberto" ter id 1; status inicial deveria ser definido por regra (cadastro marca qual é o inicial) | `database/schema.sql` (R-000) | ✅ 4.3 (R-006, migração 003) |
| B-20 | Projeto está numa pasta sincronizada pelo Google Drive (`desktop.ini`): `node_modules` e o futuro build do Vite vão sincronizar milhares de arquivos e podem gerar conflitos | raiz (R-000) | ✅ encerrado — dono não usa Google Drive no projeto |
| B-21 | Não há histórico: só `data_abertura` e `data_atualizacao`; não se sabe quem mudou o quê, nem quando o status mudou | `chamados` (R-000) | ✅ 4.5 (R-009, migração 004) |
| B-22 | Listagem de chamados sem paginação nem filtro no servidor (filtra tudo no navegador) | `chamadoController.listarChamados` (R-000) | ✅ 4.6 (R-010) |
| B-23 | Dependências do backend não instaladas nesta cópia (`node_modules` ausente) | `backend/` (R-000) | ✅ 2 (R-002) |
| B-24 | Frontend da aula ainda chama a API pelos **nomes** dos cadastros e traduz para id em `frontend/js/api.js` (ponte provisória) | `frontend/js/api.js` (R-002) | ✅ 3 (R-003) |
| B-25 | Cor dos badges de status/prioridade decidida pelo **nome** no front (provisório) | `frontend/src/features/chamados/components/ChamadoBadges.jsx` (R-003) | ✅ 4.3 (R-006) |
| B-26 | Indicadores da tela Início calculados no navegador pelo nome do status | `frontend/src/features/dashboard/InicioPage.jsx` (R-003) | ✅ 4.6 (R-010) |
| B-27 | Regras de "Aberto"/"Cancelado" reconhecem o status pelo **nome** (backend e frontend) | `chamados.service.js`, `frontend/.../chamados/permissoes.js` (R-005) | ✅ 4.3 (R-006) |
