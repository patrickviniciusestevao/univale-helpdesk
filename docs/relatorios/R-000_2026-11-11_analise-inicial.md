# R-000 — Análise inicial do projeto

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | — (diagnóstico, sem alterações no código) |
| Branch / commit | sem git (a pasta não é repositório) |
| Status | Concluído |

## Pedido
Analisar o helpdesk usado para ensinar frontend (HTML/CSS/JS puro), deixá-lo limpo e na estrutura de trabalho com agentes
(harness, regras, spec) e planejar a evolução: React + Vite + Tailwind com layout moderno, login com sessão (JWT, bcrypt),
visão do usuário comum e do administrador, cadastros de prioridades, status, setores e usuários, responsável pelo atendimento,
histórico do chamado e um dashboard mais completo.

## Documentação recebida
- `docs/legado/read-me-aula-toast.txt` (antes `read-me.txt` na raiz) — não técnica/didática — roteiro da aula para adicionar toast e
  mensagens de erro/sucesso ao frontend. Já aplicado no código atual.
- Pedido do dono nesta conversa (visão administrativa, indicadores do dashboard, setores, responsável, histórico) — virou
  `docs/modulos/*.md`.
- Os modelos do harness já tinham sido copiados para a pasta, mas crus: pasta `claude/` sem o ponto (o Claude Code não a lia),
  `HARNESS.md` e docs com `{{...}}` sem preencher, `convencoes-node-react.md` solto na raiz.

## Resultado
- **Arquitetura real:**
  - `backend/` — Node + Express 4 + `mysql2/promise`, 3 arquivos úteis: `server.js`, `config/database.js`, uma rota e um controller
    de chamados (CRUD em `/chamados`). Sem validação por biblioteca, sem autenticação, CORS aberto.
  - `frontend/` — `index_aula06v4.html` + `style.css` + 5 scripts globais (`api.js`, `ui.js`, `modal.js`, `toast.js`, `script.js`).
    Lista, busca, filtros de status/prioridade, 4 contadores, modal de criar/ver/editar/excluir, toasts.
  - `database/db_helpdesk.sql` — script da aula: 4 tabelas (`categorias`, `prioridades`, `status_chamados`, `chamados`), dados iniciais
    e 4 chamados de teste. Já tem `ativo` nos cadastros e `data_atualizacao` no chamado.
- **Estado:** `node --check` passa nos 4 arquivos do backend. `node_modules` não está instalado nesta cópia; não subi o servidor nem
  conectei ao banco. Pasta sincronizada pelo Google Drive (`desktop.ini` em cada pasta).
- **Documentação × código:** não havia documentação técnica; o que o dono descreveu é quase todo **novo** (usuários, setores,
  responsável, histórico, perfis). O que já existe e bate: categorias/prioridades/status com `ativo`, `data_abertura`/`data_atualizacao`.
- **Bugs funcionais:** B-01 a B-23 em [backlog](../backlog.md). Mais graves: **B-01** XSS (título com HTML executa script na tela),
  **B-05** API aceita status na criação, **B-06/B-07** cadastros por nome e fixos no HTML, **B-02** sem nenhum controle de acesso.
- **Segurança:** CORS aberto, senha `'root'` de fallback no código, XSS, `.env` sincronizado pelo Drive, `DROP DATABASE` no script
  → [seguranca.md](../seguranca.md).
- **Padronização:** backend todo no controller (SQL + validação + HTTP), consultas duplicadas, formato de erro `{ erro }` sem padrão
  de sucesso; frontend com variáveis globais entre scripts e HTML montado por string. Natural para o estágio de aula — a Fase 2 e a
  Fase 3 trazem os padrões do [HARNESS](../../HARNESS.md#convenções-de-código).

## Perguntas em aberto
Detalhes e recomendação em cada documento de módulo; as que mais mudam o desenho:
- [ ] **Excluir chamado** de vez ou usar status "Cancelado"? (recomendo nunca excluir) — [chamados.md](../modulos/chamados.md)
- [ ] **Quem cria usuários**: só o admin ou autocadastro? Login por e-mail ou matrícula? — [usuarios-e-acesso.md](../modulos/usuarios-e-acesso.md)
- [ ] **Setor** vem do usuário (copiado no chamado) ou é escolhido no chamado? — [chamados.md](../modulos/chamados.md)
- [ ] **Observações internas** (só equipe) × visíveis ao solicitante? — [chamados.md](../modulos/chamados.md)
- [ ] Campos extras nos cadastros (status inicial/encerra, prioridade com nível, cor e ordem) para o dashboard não depender de nomes fixos — [cadastros.md](../modulos/cadastros.md)
- [ ] Usuário comum edita o próprio chamado e escolhe prioridade? Pode reabrir resolvido?
- [ ] Terceiro perfil "técnico" agora ou depois?
- [ ] Os 4 chamados de teste: converter em usuários ou descartar na migração?
- [ ] **B-17:** manter `schema.sql` como script de aula (com `DROP DATABASE`) ou passar a guardar um dump só de estrutura?
- [ ] **B-20:** tirar o projeto da pasta do Google Drive (ou excluir `node_modules` da sincronização) antes de instalar o React?

## Proposta de fases
| # | Fase |
|---|---|
| 2 | Backend por módulos + padrões (erros, Zod, `/api`, rotas de cadastros) + bugs B-05…B-18 |
| 3 | Frontend React + Vite + Tailwind (componentes próprios, layout com sidebar), mesma funcionalidade de hoje; apagar o HTML da aula |
| 4.1 | Usuários e login (bcrypt, JWT + refresh em cookie, perfis, setores) |
| 4.2 | Chamado com dono: "Meus chamados" × todos |
| 4.3 | Cadastros auxiliares (admin) |
| 4.4 | Gestão de usuários (admin) |
| 4.5 | Atendimento: responsável, status/prioridade, observações, histórico |
| 4.6 | Dashboard completo e filtros |
| 5.x | Pré-deploy (segurança) e deploy |

Detalhe em [roadmap.md](../roadmap.md).

## Ação necessária do dono
- [ ] Responder as perguntas acima (pode ser por partes; as de usuários são necessárias antes da 4.1, as de chamados antes da 4.2).
- [ ] Validar as fases.
