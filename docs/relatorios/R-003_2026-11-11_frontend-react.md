# R-003 — Frontend React + Vite + Tailwind

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 3 — Frontend React + Vite + Tailwind |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11) |

## Pedido
O dono confirmou os testes da Fase 2 (senha no `.env`, API no ar, frontend da aula funcionando), decidiu **não usar Google Drive**
no projeto e autorizou a Fase 3: frontend novo em React + Vite + Tailwind, com componentes próprios e layout moderno, fazendo
o mesmo que a tela da aula fazia, e apagar a versão HTML.

## O que foi feito
**Frontend** (`frontend/`, projeto novo)
- Base: `package.json` (React 18.3, Vite 6, Tailwind 4.3, TanStack Query 5, React Router 6, `clsx` + `tailwind-merge`, `lucide-react`),
  `vite.config.js` (atalho `@/` → `src/`), `jsconfig.json`, `index.html` (aplica o tema salvo antes de desenhar), `public/icone.svg`,
  `.env.example` (`VITE_API_URL`), `README.md`.
- Tema (`src/index.css`): cores como variáveis CSS (claro e escuro), expostas ao Tailwind como `bg-superficie`, `text-texto-suave`,
  `bg-primaria`, `text-perigo`... Botão de tema no topo, escolha guardada no navegador.
- `lib/`: `api.js` (único `fetch`; lê `{ data, message }` e transforma `{ error }` em `ApiError` com os detalhes por campo), `format.js`
  (data, data/hora, "há 2 horas", plural), `cn.js`, `tema.js`.
- `components/ui/`: Button (+ `classesBotao` para links), Card, Field/Input/Select/Textarea, Badge, Modal (folha de baixo no celular,
  centralizado no computador, fecha com Esc/clique fora), Table, PageHeader, StatCard, LoadingState/EmptyState/Alert, Toast.
- `layouts/AppLayout.jsx`: sidebar fixa no computador, menu deslizante no celular, topo com tema e lugar do usuário ("Visitante" até a 4.1).
- `features/chamados/`: **ChamadosPage** com busca (nº, título, solicitante, descrição, sem acento), filtros por status, prioridade e
  categoria vindos da API, "Limpar filtros", contador, **tabela no computador e cartões no celular**; **ChamadoModal** para novo / ver /
  editar / excluir com confirmação, tudo controlado pela URL; **ChamadoForm** com os erros da API embaixo de cada campo e selects que
  mostram só cadastros ativos (mais o valor atual); `api.js` com os hooks (`useChamados`, `useChamado`, criar, atualizar, excluir).
- `features/cadastros/api.js`: `useCadastro(tipo)` (5 min de cache).
- `features/dashboard/InicioPage.jsx`: total, abertos, em atendimento e resolvidos (clicáveis → lista filtrada) e chamados recentes.
- **Apagados:** `frontend/index_aula06v4.html`, `frontend/style.css`, `frontend/js/` (5 arquivos) — o material da aula continua
  descrito em `docs/legado/read-me-aula-toast.txt`.

**Backend**
- Removida a rota `PUT /api/chamados/:id` (era só para o front da aula); fica o `PATCH`. `backend/README.md` atualizado.

**Docs:** `HARNESS.md` (estrutura e convenções do frontend adotadas, Tailwind 4 sem `tailwind.config.js`), `SPEC.md`, `roadmap.md`
(Fase 2 validada, Fase 3 concluída), `backlog.md` (B-01, B-06, B-07, B-15, B-20, B-24 resolvidos; B-25 e B-26 novos), `decisoes.md`
(4 decisões), `modulos/chamados.md`, `cadastros.md`, `dashboard.md`; R-002 marcado como validado.

**Banco:** nenhuma mudança.

## Decisões tomadas
- **Tailwind 4**: a configuração fica no próprio CSS (`@theme`), não em `tailwind.config.js` — HARNESS atualizado.
- **`lucide-react`** para ícones (é só ícone, não biblioteca de componentes).
- **Filtros e modal na URL**: recarregar, voltar e mandar o link mantêm a tela (ex.: `/chamados?status=1&chamado=7`).
- Cores dos badges e indicadores da tela Início ainda dependem do **nome** do status/prioridade (B-25, B-26) — resolvem-se na 4.3/4.6.
- Primeira tentativa com Tailwind 4.0.0 falhou no build (bug do plugin); fixado `^4.1.8` (instalou 4.3.5).

## Ação necessária do dono
- [ ] `cd frontend && npm run dev` (com a API rodando) e abrir `http://localhost:5173`.
- [ ] Testar: Início (números e recentes; clicar num card abre a lista filtrada) → Chamados: buscar, filtrar, limpar; abrir um chamado,
  editar (mudar status), criar um novo, tentar salvar vazio (mensagens nos campos), excluir com confirmação.
- [ ] Ver no celular (ou na largura estreita do navegador): cartões no lugar da tabela, menu ☰, modal pela parte de baixo.
- [ ] Alternar o tema claro/escuro (botão da lua/sol).
- [ ] Validar a Fase 3. **Antes da 4.1**, responder as perguntas de usuários do R-000 (login por e-mail ou matrícula, quem cria usuários,
  troca de senha no 1º acesso, perfil "técnico") — a 4.1 começa com uma migração (tabelas `usuarios` e `setores`) para você executar.

## Pendências / próximos passos
- 4.1 Usuários e login.

## Verificação realizada
- `npm run build` do frontend — ok; conferi no CSS gerado que as classes do tema (cores, `even:`, `focus:ring-3`, animação, tema escuro) existem.
- `node --check` e `require` do backend após remover o `PUT` — ok.
- **Não testado:** a tela no navegador com dados reais (não rodei a API com o banco nem abri o navegador). Visual e fluxos dependem do seu teste acima.
