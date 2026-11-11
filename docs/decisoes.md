# Decisões registradas

> Decisões de produto, arquitetura e regra de negócio, em ordem cronológica. Nova decisão = nova linha (não reescrever as antigas; se uma decisão substituir outra, dizer qual).
> Índice geral: [SPEC.md](SPEC.md). Histórico: [relatorios/](relatorios/README.md).

| Data | Decisão | Ref. |
|---|---|---|
| 2026-11-11 | Agente não altera banco; mudanças viram arquivos em `database/migrations/` executados pelo dono | R-001 |
| 2026-11-11 | Execução por fases com validação do dono entre elas; relatório a cada prompt | R-001 |
| 2026-11-11 | Segurança de infraestrutura e deploy adiados para a fase pré-deploy; o login (bcrypt/JWT/perfis) é funcionalidade e tem etapa própria (4.1) | R-001 |
| 2026-11-11 | Projeto segue **sem git** por enquanto (sem commits); hook de relatório fica instalado e passa a valer quando o repositório existir | R-001 |
| 2026-11-11 | Frontend novo em **React + Vite + Tailwind** com **componentes próprios** (sem shadcn/template pronto) | R-001 |
| 2026-11-11 | O frontend HTML/CSS/JS da aula será **apagado** quando o React o substituir (Fase 3); até lá continua funcionando | R-001 |
| 2026-11-11 | Backend continua Node/Express + MySQL com SQL puro (sem ORM), reorganizado por módulos | R-001 |
| 2026-11-11 | Dois perfis de acesso: **usuário comum** (abre e acompanha os próprios chamados) e **administrador** (gerencia tudo) | R-001 |
| 2026-11-11 | `database/db_helpdesk.sql` renomeado para `database/schema.sql` (conteúdo intacto); `read-me.txt` da aula movido para `docs/legado/` | R-001 |
| 2026-11-11 | API sob `/api`; respostas `{ data, message? }` e erros `{ error: { message, code?, details? } }`; validação com Zod | R-002 |
| 2026-11-11 | Campos do JSON com os **mesmos nomes das colunas** (snake_case: `categoria_id`, `data_abertura`) — o aluno vê o mesmo nome no SQL e na tela | R-002 |
| 2026-11-11 | Chamado referencia cadastros por **id**; a resposta traz id e nome. Status na criação é sempre o inicial (ignorado se enviado) | R-002 |
| 2026-11-11 | `PATCH` parcial; `PUT` mantido igual ao `PATCH` só por compatibilidade com o front da aula (remover na Fase 3) | R-002 |
| 2026-11-11 | Exclusão de chamado mantida como está até o dono decidir (B-04) | R-002 |
| 2026-11-11 | Google Drive fora do projeto (B-20 encerrado) | R-003 |
| 2026-11-11 | Frontend: React 18, Vite 6, Tailwind 4 (tema por variáveis CSS, sem `tailwind.config.js`), TanStack Query 5, React Router 6, ícones `lucide-react` | R-003 |
| 2026-11-11 | Filtros da lista e o modal do chamado ficam na URL (`?status=1&chamado=7`) | R-003 |
| 2026-11-11 | Frontend HTML da aula apagado; rota `PUT /api/chamados/:id` removida (só `PATCH`) | R-003 |
| 2026-11-11 | Login por **e-mail**; só o **administrador** cria usuários; **troca de senha obrigatória** no primeiro acesso; **dois perfis** (usuario, admin) — perfil "técnico" fica para depois | R-004 |
| 2026-11-11 | Senhas com `bcryptjs` (mesmo algoritmo bcrypt, sem compilação nativa), custo 10; nova senha com 8+ caracteres, letra e número | R-004 |
| 2026-11-11 | Sessão: JWT de acesso de 15 min só na memória do navegador + refresh token de 7 dias em cookie httpOnly (`path=/api/auth`), guardado no banco só como hash SHA-256 e trocado a cada renovação | R-004 |
| 2026-11-11 | CORS restrito a `FRONTEND_URL` com credenciais; API não sobe sem `JWT_SECRET` (32+ caracteres) | R-004 |
| 2026-11-11 | Primeiro administrador criado pela migração 001 (`admin@helpdesk.local`, senha temporária `Trocar@123`) | R-004 |
| 2026-11-11 | Desistência = status **Cancelado** (solicitante cancela enquanto Aberto; admin cancela qualquer um) **e** exclusão definitiva só para o admin (testes/duplicados) | R-005 |
| 2026-11-11 | Usuário comum edita o próprio chamado (título, descrição, categoria, prioridade) **só enquanto Aberto**; status e setor só o admin | R-005 |
| 2026-11-11 | Prioridade: usuário sugere ao abrir, admin ajusta | R-005 |
| 2026-11-11 | Setor do chamado copiado do usuário na abertura (admin pode corrigir) | R-005 |
| 2026-11-11 | Solicitantes dos chamados existentes viram usuários comuns (senha temporária); colunas de texto `solicitante`/`email` saem do chamado | R-005 |
| 2026-11-11 | Chamado de outra pessoa responde 404 (não revela que existe) | R-005 |
| 2026-11-11 | Status ganham **tipo** (aberto, andamento, resolvido, cancelado) no lugar do marcador "encerra" proposto: diz o mesmo e ainda indica o destino do "Cancelar chamado" e o que contar no dashboard | R-006 |
| 2026-11-11 | Exatamente **um status inicial**, ativo e do tipo aberto; marcar outro desmarca o anterior (transação) | R-006 |
| 2026-11-11 | Cor de status/prioridade guardada como **nome de cor do tema** (neutro, primaria, info, sucesso, aviso, perigo), não código hexadecimal — funciona no claro e no escuro | R-006 |
| 2026-11-11 | Prioridade tem **nível** (1–9), que também define a ordem; sem campo "ordem" separado | R-006 |
| 2026-11-11 | Cadastros auxiliares sem exclusão pela API: só criar, editar e ativar/desativar | R-006 |
| 2026-11-11 | Ao criar usuário ou redefinir senha, o **sistema gera a senha temporária** (10 caracteres, sem letras ambíguas), mostrada **uma vez** ao admin com botão de copiar; troca obrigatória no 1º acesso | R-007 |
| 2026-11-11 | Proteções: admin não tira o próprio perfil nem se desativa; sempre sobra 1 admin ativo; admin não redefine a própria senha por ali (usa "Trocar senha") | R-007 |
| 2026-11-11 | Desativar, trocar perfil ou redefinir senha **encerra as sessões** da pessoa (o acesso atual vale no máximo até o token de 15 min vencer) | R-007 |
| 2026-11-11 | Usuários não são excluídos pela API, só desativados (os chamados deles continuam) | R-007 |
| 2026-11-11 | Observações podem ser marcadas como **internas** (só a equipe vê); o **solicitante pode comentar** no próprio chamado (menos em cancelado) | R-009 |
| 2026-11-11 | **Reabrir:** o solicitante reabre um chamado Resolvido em até **7 dias** (admin sem prazo), informando o motivo; volta ao status inicial e mantém o responsável | R-009 |
| 2026-11-11 | **Assumir:** o admin vira o responsável; chamado Aberto passa para o primeiro status do tipo "Em andamento" | R-009 |
| 2026-11-11 | Responsável é sempre um **administrador ativo** (ou ninguém) | R-009 |
| 2026-11-11 | Histórico guarda os valores como **texto** (como eram na época) e é gravado na **mesma transação** da alteração | R-009 |
| 2026-11-11 | Lista de chamados com **filtros e paginação no servidor** (20 por página); filtros e página na URL | R-010 |
| 2026-11-11 | Dashboard calculado no servidor (`GET /api/dashboard`) com os **mesmos filtros da lista**: cada card abre a lista exata que gerou o número | R-010 |
| 2026-11-11 | "Alta prioridade" = maior nível entre as prioridades ativas **e** chamado não encerrado | R-010 |
| 2026-11-11 | Admin ganha a fila "Meus atendimentos" e "Sem responsável" (só chamados em aberto) | R-010 |
| 2026-11-11 | Gráfico por categoria feito com HTML + Tailwind (sem biblioteca de gráficos); uma série, uma cor | R-010 |
| 2026-11-11 | **Script SQL completo** (`database/schema_completo.sql`): estado atual sem ALTER, sem DROP DATABASE, com dados iniciais, dados de exemplo opcionais e usuário do app com permissões mínimas; `schema.sql` do dono mantido | R-011 |
| 2026-11-11 | Limite de login **por IP + e-mail** (10 erros/15 min) e teto por IP (100/15 min) — laboratório com IP compartilhado não bloqueia a turma | R-011 |
| 2026-11-11 | `helmet`, corpo JSON até 100 KB, JWT só HS256, faxina diária de sessões com mais de 30 dias, `TRUST_PROXY` para produção | R-011 |
| 2026-11-11 | **Sem deploy**: projeto encerrado para uso local/didático após a 5.1; checklist de deploy fica documentado em `seguranca.md` | R-012 |
| 2026-11-11 | Projeto passa a usar **git** (branch `main`) e será publicado num **repositório público do GitHub** para os alunos; o agente commita, **o dono faz o push**; nada de segredo no repositório | R-013 |
