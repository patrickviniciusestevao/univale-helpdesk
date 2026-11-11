# HARNESS — como trabalhar neste repositório

> **Harness** = o conjunto de regras, convenções e automações que guiam quem desenvolve aqui — o agente de IA **e** as pessoas.
> Este arquivo define **como** trabalhar. O **quê** construir está em [docs/SPEC.md](docs/SPEC.md) (índice: roadmap, decisões,
> backlog, segurança e um documento por módulo em `docs/modulos/`). O histórico do que já foi feito está em [docs/relatorios/](docs/relatorios/).
>
> Para ferramentas de IA: o Claude Code só carrega sozinho um arquivo chamado `CLAUDE.md`; por isso o [CLAUDE.md](CLAUDE.md) da raiz
> apenas importa este arquivo (`@HARNESS.md`). O [AGENTS.md](AGENTS.md) faz o mesmo para outras ferramentas (Cursor, Codex…).
> **Edite sempre este arquivo**, nunca os dois atalhos.

## Projeto em uma linha
**Univale Helpdesk** — usuários abrem chamados de suporte e a equipe de atendimento (administradores) acompanha, atende e gerencia
chamados, cadastros e usuários. Nasceu como material didático de frontend (HTML/CSS/JS puro) e evolui para React + Vite + Tailwind
com API Node/Express, login com JWT e senhas com bcrypt. **Também é material de aula:** o código precisa ser legível para alunos.

## Regras inegociáveis
1. **Banco de dados é do dono.** O agente NÃO executa SQL, migrations, scripts de carga nem altera schema/dados.
   Quando o código exigir mudança no banco, criar **um arquivo de migração** `database/migrations/NNN_descricao.sql`
   com o cabeçalho padrão (`Status: Proposta`), adicionar a linha no índice de [database/README.md](database/README.md)
   e avisar o dono. Ler `database/schema.sql` é permitido; editar seu conteúdo, não. Atualizar o status/execução de uma
   migração só quando o dono informar que executou.
2. **Uma fase/etapa por vez.** Ao concluir, parar e aguardar validação explícita do dono antes de seguir.
3. **Relatório a cada prompt.** Todo prompt que alterar o projeto gera um relatório em `docs/relatorios/`
   (modelo em [docs/relatorios/README.md](docs/relatorios/README.md)) e atualiza o índice desse README.
   Atualizar também o documento do assunto: status da etapa em `docs/roadmap.md`, decisão nova em `docs/decisoes.md`,
   problema/melhoria em `docs/backlog.md`, regra de um módulo em `docs/modulos/<modulo>.md`; `docs/SPEC.md` só para visão,
   princípios e arquitetura.
4. **Foco em produção, poucos testes.** Validar só o mínimo para não quebrar: `npm run build` do frontend e
   `node --check` / `require` dos módulos do backend. Não criar suítes de teste nem rodar validações longas sem pedido.
5. **Segurança e deploy ficam para a fase pré-deploy** (ver `docs/roadmap.md` e `docs/seguranca.md`). Não bloquear trabalho por isso,
   mas nunca versionar `.env`, arquivos de `docs/infra/` nem adicionar novos segredos ao código.
   Exceção: o **login** (bcrypt, JWT, perfis) é funcionalidade do produto e é feito na sua própria etapa, não adiado.
6. **Git:** o projeto usa git desde 2026-11-11 (R-013), branch `main`, e será publicado num repositório **público** do GitHub
   para os alunos. Um commit por fase/etapa concluída, **sem push** (quem envia ao GitHub é o dono); o hook
   `.claude/hooks/exigir-relatorio.js` exige relatório em todo commit. Como o repositório é público, conferir antes de cada
   commit que nenhum segredo entra (`.env`, `docs/infra/`, senhas reais).

## Fluxo de uma etapa (resumo)
1. Ler o pedido; conferir a etapa em [docs/roadmap.md](docs/roadmap.md) e o documento do módulo em `docs/modulos/`.
2. Dúvida que muda o resultado (regra de negócio, quem pode ver/alterar o quê, onde guardar dado) → perguntar ao dono antes de construir.
3. Precisa de banco → proposta de migração (skill `nova-migracao`) e esperar o dono executar.
4. Implementar seguindo as convenções abaixo; verificar o mínimo.
5. Relatório + documentos do assunto (skill `novo-relatorio`).
6. Parar e esperar a validação do dono.

## Como falar com o dono
- Português claro, sem jargão desnecessário; o dono é professor e conhece o código, mas o texto também pode virar material para alunos.
- Exemplos concretos do dia a dia ("João, da Secretaria, abriu um chamado de impressora; Patrick está atendendo") valem mais que descrição técnica.
- Quando houver opções, recomendar uma e dizer por quê. Decisão tomada vira linha em `docs/decisoes.md`.
- Ao terminar, dizer o que o dono precisa fazer (testar, executar migração, validar) em checklist.

## Automação do harness (`.claude/`)
| Arquivo | O que faz |
|---|---|
| [.claude/settings.json](.claude/settings.json) | Configuração do projeto para o Claude Code (hooks). Vale para todo o time. |
| [.claude/hooks/exigir-relatorio.js](.claude/hooks/exigir-relatorio.js) | Antes de qualquer `git commit` do agente, exige um relatório `docs/relatorios/R-*.md` novo ou alterado; sem ele, o commit é bloqueado (regra 3). Sem git, não faz nada. |
| [.claude/skills/nova-migracao/](.claude/skills/nova-migracao/SKILL.md) | Roteiro para propor mudança de banco: arquivo `database/migrations/NNN_*.sql` com cabeçalho padrão + índice (regra 1). |
| [.claude/skills/novo-relatorio/](.claude/skills/novo-relatorio/SKILL.md) | Roteiro do relatório de cada prompt e da atualização dos documentos do assunto (regra 3). |

As skills também servem de checklist para pessoas: o passo a passo está escrito em português em cada `SKILL.md`.
Configurações pessoais (não versionadas) vão em `.claude/settings.local.json`.

## Estrutura do repositório
```
backend/    API Node.js (Express, mysql2)                    → cd backend && npm run dev   (porta 3000)
frontend/   React + Vite + Tailwind (componentes próprios)    → cd frontend && npm run dev   (porta 5173)
database/   schema.sql (script do dono) + migrations/ + README.md → o agente só propõe; quem executa é o dono
docs/       SPEC.md (índice), roadmap, decisoes, backlog, seguranca, modulos/, relatorios/, legado/
            (+ infra/ local, fora do git)
.claude/    automação do harness: settings.json (hooks), hooks/, skills/
HARNESS.md  este arquivo · CLAUDE.md e AGENTS.md = atalhos para as ferramentas de IA
```

## Convenções de código
**Gerais**
- Idioma: domínio do negócio em **português** (chamado, solicitante, setor, prioridade); nomes técnicos consagrados podem ficar em inglês
  (`routes`, `controller`, `token`).
- Comentários em português, curtos, só quando explicam o "porquê" — o código é lido por alunos, então prefira clareza a esperteza.
- Sem dependência nova sem motivo; cada biblioteca adicionada entra na tabela de stack do [SPEC](docs/SPEC.md#41-stack-e-bibliotecas).

**Backend** *(adotadas na Fase 2 — R-002; detalhes em [backend/README.md](backend/README.md))*
- Organização por módulo: `src/modules/<modulo>/<modulo>.routes|controller|service.js` + `<tabela>.repository.js`.
  Módulos previstos: `auth`, `usuarios`, `chamados`, `cadastros` (categorias, prioridades, status, setores), `dashboard`.
- Estilo único: objeto literal exportado (`module.exports = { ... }`), sem `class` (exceção: `AppError`).
- Camadas: routes (URL + validação + permissão) → controller (HTTP) → service (regra de negócio) → repository (SQL).
  Repository não tem try/catch e não acessa outro módulo.
- Erros: services lançam `badRequest/unauthorized/forbidden/notFound/conflict` de `shared/errors`; nunca fazem `res.status(500)`.
  O `errorHandler` global responde `{ error: { message, code?, details? } }`.
- Sucesso: `ok(res, data, { meta?, message? })` / `created(...)` de `shared/http` → corpo `{ data, meta?, message? }`.
- Validação com **Zod** via `validate({ body | params | query })` nas rotas.
- SQL sempre parametrizado (`?`), sem ORM. Fluxos multi-tabela (ex.: alterar chamado + gravar histórico) usam `withTransaction`.
- Atualização parcial (PATCH/PUT) não apaga campos não enviados (`mergeDefined`).
- Cadastros auxiliares **não são apagados**: são desativados (`ativo = 0`); listas de escolha mostram só os ativos.
- **Autenticação** (`shared/auth.js`, módulo `auth`): senha com **bcrypt** (`bcryptjs`); login devolve **JWT de acesso curto** e um **refresh token em cookie httpOnly**
  (detalhe em [docs/modulos/usuarios-e-acesso.md](docs/modulos/usuarios-e-acesso.md)). Middleware `autenticar` em toda rota de `/api`
  (menos login/refresh) e `exigirPerfil('admin')` nas rotas administrativas. **A permissão é conferida no servidor**; esconder botão
  na tela é só conforto.

**Frontend** *(adotadas na Fase 3 — R-003; detalhes em [frontend/README.md](frontend/README.md))*
- React + Vite + **somente Tailwind**, com **componentes próprios** (sem biblioteca de UI). Classes combinadas com `cn()` de `lib/cn`.
- Tailwind 4 (sem `tailwind.config.js`): cores do tema são variáveis CSS em `src/index.css` (`@theme`), trocadas pela classe `.dark`;
  telas usam só os nomes (`bg-superficie`, `text-texto-suave`, `bg-primaria`...), nunca `dark:` nem cor fixa.
- Ícones: `lucide-react` (só ícones; não é biblioteca de componentes).
- Componentes base em `src/components/ui/` (Button, Card, Input/Select/Textarea/Field, Badge, Modal, Table, PageHeader,
  StatCard, LoadingState/EmptyState/Alert, Toast) — reutilizar antes de criar markup novo. Link com cara de botão: `classesBotao()`.
- Layouts em `src/layouts/` (`AppLayout` com sidebar + topo; `AuthLayout` para login na 4.1). Menu muda conforme o perfil (4.1).
- Código por feature: `src/features/<modulo>/` (páginas, componentes, `api.js` com os hooks).
- Dados do servidor via **TanStack Query** nos `api.js`; chamadas HTTP só pelo cliente `lib/api.js` (que anexa o token e renova
  com o refresh). Telas não usam `fetch` nem `useEffect` para buscar dados.
- Rotas com **React Router** em `src/routes.jsx`; `RotaProtegida` (logado) e `RotaAdmin` (perfil admin) entram na 4.1.
- Formatação de datas/textos só via `lib/format.js`.
- Responsivo **mobile-first**: desenhar para 360px primeiro; listas viram cards no celular, tabela no computador.
- **Padrão de listas:** barra de filtros no topo (busca + filtros + "Limpar filtros"), tabela no computador / cartões no celular,
  filtros e detalhe em `Modal` controlados pela URL (`/chamados?status=1&chamado=17`). Nada de texto abaixo de 12 px.
