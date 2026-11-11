# Roadmap — fases e etapas

> Uma etapa por vez, com validação do dono entre elas (HARNESS.md, regra 2). Ao concluir ou validar uma etapa, atualizar o status aqui.
> Índice geral: [SPEC.md](SPEC.md). Histórico: [relatorios/](relatorios/README.md).

Legenda: ✅ Validada · ✅ Concluída — aguardando validação · ⏳ Próxima / planejada / aguardando · 💭 Futuro · ⛔ Dispensada

| # | Fase / etapa | Status | Relatório |
|---|---|---|---|
| 0 | Ponto de restauração (git + commit do estado atual) | ✅ Concluída — aguardando validação: repositório git criado com o estado final (branch `main`), para publicar no GitHub da aula | R-001, R-013 |
| 1 | Harness, documentação por assunto e análise inicial | ✅ Validada (2026-11-11) | R-000, R-001 |
| 2 | **Backend por módulos + padrões**: `src/modules/`, prefixo `/api`, `shared/errors` + `errorHandler`, respostas `{ data }`, Zod, `GET` dos cadastros (para o front parar de fixar opções no HTML), bugs B-05 a B-13, B-16, B-18 | ✅ Validada (2026-11-11) | R-002 |
| 3 | **Frontend React + Vite + Tailwind**: projeto novo em `frontend/`, tema, componentes base, `AppLayout` (sidebar + topo), tela de chamados equivalente à atual (lista, filtros, criar/editar/ver) — **apaga o frontend HTML da aula** | ✅ Validada (2026-11-11) | R-003 |
| 4.1 | **Usuários e login**: tabela `usuarios` + `setores` (migração), bcrypt, JWT + refresh em cookie, perfis `usuario`/`admin`, tela de login, rotas protegidas, primeiro administrador | ✅ Validada (2026-11-11) | R-004 |
| 4.2 | **Chamado com dono**: solicitante = usuário logado; visão do usuário comum ("Meus chamados", abrir chamado) × visão do administrador (todos); cancelar; excluir só admin (migração 002) | ✅ Validada (2026-11-11) | R-005 |
| 4.3 | **Cadastros auxiliares** (admin): categorias, prioridades, status e setores — criar, editar, ativar/desativar; status com tipo/inicial/cor/ordem, prioridade com nível/cor (migração 003) | ✅ Validada (2026-11-11) | R-006 |
| 4.4 | **Gestão de usuários** (admin): criar, editar, definir perfil e setor, ativar/desativar, redefinir senha (senha temporária gerada pelo sistema) | ✅ Validada (2026-11-11) | R-007, R-008 |
| 4.5 | **Atendimento**: responsável, alterar status/prioridade, observações (internas ou não) e **histórico** do chamado; reabrir em 7 dias (migração 004) | ✅ Validada (2026-11-11) | R-009 |
| 4.6 | **Dashboard e filtros**: total, abertos, em atendimento, resolvidos, alta prioridade, por categoria, recentes; filtros por status, categoria, prioridade, setor, responsável; paginação — tudo calculado no servidor | ✅ Validada (2026-11-11) | R-010 |
| 5.1 | Pré-deploy: segurança ([seguranca.md](seguranca.md)) + script SQL completo (`database/schema_completo.sql`) | ✅ Concluída — aguardando validação | R-011 |
| 5.2 | Deploy | ⛔ Dispensada pelo dono (2026-11-11) — uso local/didático; checklist pronto em [seguranca.md](seguranca.md) caso mude | R-012 |
| — | Comentários/conversa no chamado, anexos, e-mail de notificação, SLA por prioridade, PWA, relatórios | 💭 | |

**Por que essa ordem:** a Fase 2 deixa a API organizada antes de crescer; a Fase 3 troca a tela sem mudar regra (fica fácil comparar
com a versão da aula); o login (4.1) vem antes de tudo que depende de "quem é o usuário"; histórico (4.5) vem depois de existir
responsável e usuários; o dashboard (4.6) por último, quando todos os dados que ele mostra já existem.
