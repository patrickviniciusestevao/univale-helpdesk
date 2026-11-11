# R-012 — Encerramento do projeto

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | — (encerramento) |
| Branch / commit | sem git |
| Status | Encerrado — sem deploy, por decisão do dono |

## Pedido
"Não faremos deploy, então finalizamos?" — encerrar o projeto após a 5.1.

## Estado final
**Do helpdesk de aula (HTML/CSS/JS, CRUD aberto) para:**
- **Backend** Node/Express por módulos (`auth`, `usuarios`, `chamados`, `cadastros`, `dashboard`), Zod, erros e respostas num formato
  único, SQL parametrizado, transações; login com **bcrypt + JWT (15 min) + refresh em cookie httpOnly**, perfis usuário/admin,
  limite de tentativas, helmet.
- **Frontend** React + Vite + Tailwind com componentes próprios, tema claro/escuro, layout com sidebar, mobile-first.
- **Usuário comum:** abre e acompanha os próprios chamados, edita/cancela enquanto Aberto, conversa com a equipe, reabre em até 7 dias.
- **Administrador:** todos os chamados com filtros e paginação no servidor, assumir/atribuir responsável, observações internas, histórico,
  cadastros (categorias, prioridades, status com tipo/inicial/cor, setores), usuários (senha temporária gerada pelo sistema), dashboard.
- **Banco:** migrações 001–004 executadas; `database/schema_completo.sql` cria tudo do zero no estado atual.
- **Harness:** `HARNESS.md`, `docs/` (SPEC, roadmap, decisões, backlog, segurança, módulos), 13 relatórios (R-000 a R-012), skills e hook.

## Pendências deixadas registradas (não bloqueiam o uso local)
- Testes manuais da 5.1 (limite de login) e conferência do `schema_completo.sql` num banco vazio — R-011.
- Decidir se `schema_completo.sql` substitui `schema.sql` — R-011.
- Git: o projeto segue sem repositório; quando criar, o hook de relatório passa a valer (HARNESS, regra 6).
- Ideias futuras: anexos, e-mail de aviso, recuperação de senha por e-mail, tempo médio de atendimento, filtro de período no dashboard.
- Se um dia houver deploy: seguir a seção "Configuração do deploy" de `docs/seguranca.md`.

## Como retomar
Ler `HARNESS.md` → `docs/roadmap.md` → último relatório. Subir: `cd backend && npm run dev` e `cd frontend && npm run dev`.
Instalação nova: executar `database/schema_completo.sql` e criar `backend/.env` a partir do `.env.example` (com `JWT_SECRET`).

## Verificação realizada
- Nenhuma alteração de código neste prompt (só `docs/roadmap.md`, `docs/decisoes.md` e este relatório).
