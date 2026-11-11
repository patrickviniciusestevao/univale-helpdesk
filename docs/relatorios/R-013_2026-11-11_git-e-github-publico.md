# R-013 — Versionamento com git para o GitHub público da aula

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 0 — Ponto de restauração (git + commit do estado atual) |
| Branch / commit | main / primeiro commit do repositório |
| Status | Concluído — aguardando validação |

## Pedido
"Vamos versionar e fazer o commit, para eu passar para os alunos o GitHub público da aula." O dono muda a decisão do R-001
(projeto sem git) e passa a usar repositório, que será **público**.

## O que foi feito
- Repositório git criado na raiz do projeto, branch `main`, com um commit do estado atual (fases 1 a 5.1 + relatório técnico).
- Conferência do que entra no repositório público:
  - `.gitignore` da raiz já exclui `node_modules/`, `dist/`, `.env` e `.env.*` (menos `.env.example`), `docs/infra/`,
    `.claude/settings.local.json`, `desktop.ini`, logs. **`backend/.env` (senha do MySQL e `JWT_SECRET`) não entra.**
  - Busca por segredos (senhas, chaves, tokens, e-mails pessoais, IPs) nos arquivos versionados: nada encontrado além do item abaixo.
- `HARNESS.md` regra 6 — git em uso, branch `main`, sem push pelo agente, cuidado com segredos por ser público.
- `.claude/skills/novo-relatorio/SKILL.md` passo 6 — mesma regra.
- `docs/roadmap.md` — etapa 0 passa a concluída; `docs/decisoes.md` — nova linha; `docs/relatorios/README.md` — índice.
- `RELATORIO_TECNICO_COMPLETO_HELPDESK.md` (raiz) — relatório técnico gerado no prompt anterior, incluído no commit.

## Decisões tomadas
- **Branch `main`** (padrão do GitHub).
- **O agente não faz push**: o dono cria o repositório no GitHub e envia (`gh` não está instalado nesta máquina).
- A senha temporária padrão do primeiro administrador (`Trocar@123`, citada nos scripts SQL e nos docs) **continua publicada**:
  é material de aula, o sistema obriga a troca no primeiro login e cada aluno instala o próprio banco.

## Ação necessária do dono
- [ ] Criar o repositório **público** no GitHub (sem README, sem .gitignore, sem licença — para não conflitar com o commit local).
- [ ] Na pasta do projeto: `git remote add origin https://github.com/<usuario>/<repositorio>.git` e `git push -u origin main`.
- [ ] Abrir o repositório no navegador e conferir que **não aparece** `backend/.env`.
- [ ] Se o seu MySQL local usa a senha `root` citada no R-002, lembrar que ela fica visível no histórico (é só a senha de um banco local).
- [ ] Opcional: escolher uma licença (ex.: MIT, já declarada em `backend/package.json`) e um `README.md` na raiz para os alunos.

## Verificação realizada
- `git status` conferido antes do commit (nenhum `.env`, `node_modules` ou `desktop.ini` na lista).
- Nenhum código alterado; build e testes não foram executados.
