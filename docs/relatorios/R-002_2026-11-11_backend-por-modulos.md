# R-002 — Backend por módulos e padrões

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 2 — Backend por módulos + padrões |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11) |

## Pedido
"Autorizado" — validação da Fase 1 e início da Fase 2: reorganizar a API em módulos com padrões de erro, resposta e validação,
rotas para os cadastros e correção dos bugs do backend levantados no R-000.

## O que foi feito
**Backend** (`backend/src/`)
- `config/env.js` (novo) — único lugar que lê o `.env`; carregado antes de tudo (B-11). **Sem senha padrão `'root'`** (B-10).
- `config/db.js` (substitui `config/database.js`) — pool + `testarConexao` + `withTransaction` (pronto para o histórico da 4.5).
- `shared/errors.js` — `AppError`, `badRequest/unauthorized/forbidden/notFound/conflict`, 404 de rota inexistente e `errorHandler`
  global (trata erro de validação, JSON mal formado, nome duplicado e erro inesperado sem vazar detalhe) (B-16).
- `shared/http.js` — `ok/created` (`{ data, message? }`), `wrapAll` (erro de função async vai ao `errorHandler`), `mergeDefined`.
- `shared/validate.js` — middleware `validate({ body|params|query })` com Zod e peças reutilizáveis (`id`, `idParam`, `textoObrigatorio`), mensagens em português.
- `modules/chamados/` — `routes → controller → service → repository`:
  - uma única consulta base (antes duplicada) que devolve id **e** nome de categoria/prioridade/status e as datas completas (B-09, B-18);
  - criação **ignora o status** enviado; o banco aplica o inicial (B-05);
  - categoria/prioridade/status recebidos por **id** e conferidos como **existentes e ativos** (B-06, B-08); na alteração só confere o que mudou;
  - `PATCH` parcial — dá para mudar só o status (B-12); `PUT` faz o mesmo (compatibilidade); `id` da URL validado (B-13).
- `modules/cadastros/` — `GET /api/cadastros/:tipo?ativos=1` para categorias, prioridades e status (B-07) e `garantirAtivo`, usado pelos chamados.
- `app.js` (novo) separado de `server.js`; toda a API sob `/api`; `GET /api/health`.
- Removidos: `routes/chamadoRoutes.js`, `controllers/chamadoController.js`, `config/database.js`.
- `package.json`: + `zod@^3.23.8`; `npm install` executado (B-23).
- `backend/README.md` (novo): como rodar, estrutura, formato das respostas, rotas e exemplo. `.env.example` com aviso sobre `DB_PASSWORD`.

**Frontend da aula** — só `frontend/js/api.js`: passa a usar `/api`, ler `{ data }` e as mensagens de erro da API, e traduz os nomes
escolhidos no formulário para ids (ponte provisória, B-24). O resto do frontend não mudou; ele sai na Fase 3.

**Banco:** nenhuma mudança, nenhuma migração.

**Docs:** `backlog.md` (10 itens resolvidos, 2 parciais, B-24 novo), `roadmap.md` (Fase 1 validada, Fase 2 concluída), `decisoes.md`
(5 decisões), `SPEC.md`, `HARNESS.md` (convenções de backend adotadas), `modulos/chamados.md`, `modulos/cadastros.md`, `seguranca.md`.

## Decisões tomadas
- JSON com os mesmos nomes das colunas (`categoria_id`, `data_abertura`) — o aluno vê o mesmo nome no SQL e na resposta.
- Status inicial continua vindo do `DEFAULT 1` do banco (sem nome fixo no código); a regra configurável fica para a 4.3 (B-19).
- `DELETE` mantido como estava até sua decisão sobre exclusão (B-04).
- CORS segue aberto (pré-deploy).

## Ação necessária do dono
- [x] **Colocar a senha do MySQL no `backend/.env`** (`DB_PASSWORD=root`, se for a mesma de antes). Hoje está vazio e a API só
  conectava por causa da senha escondida no código, que foi removida. Sem isso, o servidor avisa e não sobe.
- [x] Subir a API (`cd backend && npm run dev`) e abrir `http://localhost:3000/api/chamados` e `http://localhost:3000/api/cadastros/status`.
- [x] Abrir o frontend da aula (`frontend/index_aula06v4.html`) e testar: listar, criar, editar (mudar o status), excluir.
- [x] Validar a Fase 2 e autorizar a **Fase 3** (React). Antes dela: decidir sobre a pasta do Google Drive (B-20).

## Pendências / próximos passos
- Fase 3: frontend React + Vite + Tailwind usando `GET /api/cadastros` para os selects; remover a ponte do `api.js` (some com o front da aula) e o `PUT`.
- Perguntas do R-000 seguem em aberto (necessárias a partir da 4.1).

## Verificação realizada
- `node --check` em todos os arquivos do backend e no `frontend/js/api.js` — ok.
- Subi o `app.js` numa porta temporária e chamei as rotas que **não** dependem do banco: health (200), rota inexistente (404),
  id inválido, corpo vazio, e-mail inválido, `PATCH` vazio, `ativos` inválido, JSON mal formado (todos 400 com mensagem em português)
  e cadastro inexistente (404) — ok.
- **Não testado:** nada que toque o MySQL (listar, criar, editar, excluir de verdade) nem o frontend no navegador — o `.env`
  está sem senha e não executo nada no banco (regra 1).
