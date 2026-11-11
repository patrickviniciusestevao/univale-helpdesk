# Backend — API Univale Helpdesk

Node.js + Express + MySQL (`mysql2`, SQL puro) + Zod. Convenções em [../HARNESS.md](../HARNESS.md#convenções-de-código).

## Rodar
```bash
cp .env.example .env   # preencher DB_PASSWORD com a senha do seu MySQL
npm install
npm run dev            # http://localhost:3000/api
```

## Estrutura
```
src/
  server.js          sobe o servidor (testa o banco antes)
  app.js             middlewares, rotas em /api, 404 e tratador de erros
  config/env.js      lê o .env (único lugar com process.env)
  config/db.js       pool MySQL + withTransaction
  shared/errors.js   AppError, badRequest/notFound/..., errorHandler
  shared/http.js     ok/created, wrapAll, mergeDefined
  shared/validate.js validate({ body|params|query }) + peças Zod (id, idParam, textoObrigatorio)
  shared/auth.js     PERFIS, gerarTokenAcesso, autenticar, exigirSenhaTrocada, exigirPerfil
  shared/senhas.js   bcrypt (gerarHash, conferir), senha temporária
  modules/<modulo>/  <modulo>.routes → .controller → .service → <tabela>.repository
```

**Caminho de uma requisição:** `routes` (URL + validação Zod) → `controller` (só HTTP) → `service` (regra de negócio, lança erros)
→ `repository` (SQL). Qualquer erro lançado vira resposta no `errorHandler`.

## Formato das respostas
- Sucesso: `{ "data": ..., "message"?: "..." }`
- Erro: `{ "error": { "message": "...", "code"?: "VALIDACAO", "details"?: [{ "campo", "mensagem" }] } }`

## Rotas
Todas, menos `/api/health` e `/api/auth/login|refresh|logout`, exigem `Authorization: Bearer <token>`; quem está com senha temporária recebe 403 `TROCAR_SENHA` fora de `/api/auth`.

| Método e rota | O quê |
|---|---|
| `GET /api/health` | API no ar (público) |
| `POST /api/auth/login` | público — `{ email, senha }` → `{ token, usuario }` + cookie da sessão |
| `POST /api/auth/refresh` | cookie → novo `{ token, usuario }` (troca o cookie) |
| `POST /api/auth/logout` | encerra a sessão e apaga o cookie |
| `GET /api/auth/me` | logado — dados do usuário |
| `PATCH /api/auth/senha` | logado — `{ senha_atual, nova_senha }` → novo token |
| `GET /api/usuarios` | **admin** — lista (sem senha) |
| `POST /api/usuarios` | **admin** — `nome`, `email`, `perfil`, `setor_id?` → `{ usuario, senha_temporaria }` |
| `PATCH /api/usuarios/:id` | **admin** — altera (inclui `ativo`); não tira o próprio admin, não se desativa, sempre sobra 1 admin |
| `POST /api/usuarios/:id/redefinir-senha` | **admin** — nova senha temporária, encerra as sessões → `{ usuario, senha_temporaria }` |
| `GET /api/cadastros/:tipo?ativos=1` | `categorias`, `prioridades`, `status` ou `setores` (com `ativos=1`, só os ativos) — logado |
| `POST /api/cadastros/:tipo` | **admin** — cria: `nome`, `ativo?`; prioridades: `nivel`, `cor`; status: `tipo`, `inicial?`, `cor`, `ordem` |
| `PATCH /api/cadastros/:tipo/:id` | **admin** — altera só o enviado (inclui `ativo` para desativar/reativar). Não há DELETE |
| `GET /api/chamados` | lista paginada (mais recentes primeiro) — admin vê todos; usuário comum, só os dele. Filtros: `busca`, `status_id`, `tipo`, `situacao` (ativos/encerrados), `prioridade_id`, `categoria_id`, `setor_id`, `responsavel` (id/eu/nenhum), `alta=1`, `pagina`, `por_pagina` → `meta: { total, pagina, por_pagina, paginas }` |
| `GET /api/dashboard` | logado — total, por tipo de status, alta prioridade, por categoria, recentes; admin: + meus atendimentos e sem responsável |
| `GET /api/chamados/:id` | detalhe (chamado de outra pessoa → 404 para o usuário comum) |
| `POST /api/chamados` | abre — `titulo`, `descricao`, `categoria_id`, `prioridade_id`; solicitante = usuário logado, setor = o dele, status inicial automático |
| `PATCH /api/chamados/:id` | altera só os campos enviados. Admin: tudo (inclui `status_id`, `setor_id`, `usuario_responsavel_id`). Usuário: o próprio, só enquanto Aberto, sem status/setor |
| `POST /api/chamados/:id/assumir` | **admin** — vira o responsável; Aberto → primeiro status "Em andamento" |
| `POST /api/chamados/:id/observacoes` | `{ texto, interna? }` — solicitante ou admin; `interna` só vale para admin |
| `POST /api/chamados/:id/reabrir` | `{ motivo }` — Resolvido → status inicial; solicitante até 7 dias após o encerramento |
| `GET /api/chamados/:id/historico` | linha do tempo (solicitante não recebe as internas) |
| `POST /api/chamados/:id/cancelar` | status Cancelado — usuário: o próprio enquanto Aberto; admin: qualquer um |
| `DELETE /api/chamados/:id` | exclusão definitiva — **só admin** |

Exemplo de chamado devolvido:
```json
{ "id": 1, "titulo": "Computador não inicia", "descricao": "...", "usuario_solicitante_id": 2, "solicitante": "João Silva",
  "solicitante_email": "joao@exemplo.com", "setor_id": 2, "setor": "Secretaria",
  "categoria_id": 1, "categoria": "Hardware", "prioridade_id": 3, "prioridade": "Alta", "prioridade_nivel": 3, "prioridade_cor": "perigo",
  "status_id": 1, "status": "Aberto", "status_tipo": "aberto", "status_cor": "info",
  "data_abertura": "2026-11-11T12:02:00.000Z", "data_atualizacao": "2026-11-11T12:02:00.000Z" }
```
