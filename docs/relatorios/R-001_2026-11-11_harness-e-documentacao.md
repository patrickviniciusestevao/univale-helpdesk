# R-001 — Harness e documentação inicial

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 0 e 1 — ponto de restauração (dispensado) e harness/documentação |
| Branch / commit | sem git (decisão do dono) |
| Status | Validado pelo dono (2026-11-11) |

## Pedido
Deixar o projeto limpo e na estrutura de trabalho com agentes (harness, regras, spec), preparando a evolução descrita no R-000.
Respostas do dono nesta etapa: **sem git por enquanto**; o frontend HTML da aula será **apagado** quando o React chegar;
visual com **componentes próprios** em Tailwind; banco **só o dono** executa.

## O que foi feito
**Harness**
- `HARNESS.md` preenchido: projeto em uma linha, regras (sem a regra de sistemas externos, que não existem aqui; regra de git
  adaptada para "sem git"; verificação mínima definida), estrutura real, convenções de backend e frontend (marcadas como proposta),
  incluindo autenticação com bcrypt + JWT + refresh em cookie.
- `AGENTS.md` ajustado (tirada a menção a sistema externo/trava; incluído "não criar git sem pedido"). `CLAUDE.md` mantido (`@HARNESS.md`).
- `claude/` → **`.claude/`** (sem o ponto o Claude Code não carregava hooks nem skills); skills `novo-relatorio` e `nova-migracao`
  com o nome do projeto e sem referências a branch/commit.
- `convencoes-node-react.md` (raiz) apagado — conteúdo incorporado e adaptado no HARNESS.
- `.gitignore` na raiz: `node_modules/`, `dist/`, `.env*` (menos `.env.example`), `docs/infra/`, `.claude/settings.local.json`, `desktop.ini`.

**Documentação** (`docs/`)
- `SPEC.md` — contexto, princípios, módulos, stack, estrutura alvo, glossário (solicitante, responsável, setor, histórico…).
- `roadmap.md` — fases 0 a 5 com status.
- `decisoes.md` — 9 decisões desta conversa.
- `backlog.md` — B-01 a B-23.
- `seguranca.md` — checklist + 7 itens encontrados.
- `modulos/usuarios-e-acesso.md`, `modulos/chamados.md`, `modulos/cadastros.md`, `modulos/dashboard.md` — processo, regras, exemplos
  ("João abriu, Patrick está atendendo"), dados, rotas previstas e perguntas em aberto. `modulos/_modelo.md` mantido como modelo.
- `legado/read-me-aula-toast.txt` — antigo `read-me.txt` da raiz, intacto.
- `relatorios/` — R-000, R-001 e índice.

**Banco**
- `database/db_helpdesk.sql` → **`database/schema.sql`** (só renomeado, conteúdo intacto); `database/migrations/` criada;
  `database/README.md` explica o script e alerta para o `DROP DATABASE`. Nenhum SQL executado.

**Código:** nenhuma alteração em `backend/` ou `frontend/`.

## Decisões tomadas
- Mantido Node/Express + MySQL sem ORM (já existe e é didático) — registrado em `decisoes.md`.
- Frontend antigo **não** foi apagado agora: ainda é a única tela que funciona; sai na Fase 3, quando o React fizer o mesmo.
- `desktop.ini` não foi apagado: é do Google Drive, que o recria; apenas ignorado no `.gitignore`.
- Ordem das fases: organizar a API (2) e trocar a tela (3) antes das funcionalidades novas, e login (4.1) antes de tudo que depende do usuário.

## Ação necessária do dono
- [ ] Ler `HARNESS.md` e validar as regras e as convenções (marcadas como proposta).
- [ ] Validar o roadmap e responder as perguntas do R-000 (pelo menos as de usuários, antes da 4.1).
- [ ] Decidir sobre a pasta do Google Drive (B-20) antes de instalar o React.
- [x] Autorizar o início da **Fase 2** (backend por módulos).

## Pendências / próximos passos
- Fase 2: `npm install` no backend, reorganização em `src/modules/`, padrões de erro/resposta/validação, rotas de cadastros, bugs B-05…B-18.

## Verificação realizada
- `node --check` em `server.js`, `config/database.js`, `routes/chamadoRoutes.js`, `controllers/chamadoController.js` e no hook — ok.
- Não testado: subir a API, conectar ao MySQL, abrir o frontend (dependências não instaladas; código não foi alterado).
