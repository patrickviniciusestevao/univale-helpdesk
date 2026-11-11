# Relatório Técnico Completo — Univale Helpdesk

> **Data da análise:** 2026-11-11
> **Escopo:** estado atual do código em `frontend/`, `backend/` e `database/` (sem `node_modules`, sem `dist`).
> **Método:** leitura direta do código-fonte. Nenhum arquivo foi alterado, nenhum comando de build, instalação ou banco foi executado.
> Onde algo não existe no código, está escrito **NÃO EXISTE NO PROJETO ATUAL**.

---

## Sumário

1. [Visão geral do sistema](#1-visão-geral-do-sistema)
2. [Estrutura de pastas e arquivos](#2-estrutura-de-pastas-e-arquivos)
3. [Front-end React](#3-front-end-react)
4. [JSX](#4-jsx)
5. [Componentização](#5-componentização)
6. [Props](#6-props)
7. [State e Hooks](#7-state-e-hooks)
8. [Eventos e interação](#8-eventos-e-interação)
9. [Tailwind CSS](#9-tailwind-css)
10. [Formulários](#10-formulários)
11. [Autenticação e perfis](#11-autenticação-e-perfis)
12. [Visão do usuário](#12-visão-do-usuário)
13. [Visão do administrador](#13-visão-do-administrador)
14. [Integração com API](#14-integração-com-api)
15. [Back-end](#15-back-end)
16. [Banco de dados](#16-banco-de-dados)
17. [Fluxos completos do sistema](#17-fluxos-completos-do-sistema)
18. [Trechos representativos do front-end](#18-principais-trechos-representativos-do-front-end)
19. [Trechos representativos do back-end](#19-principais-trechos-representativos-do-back-end)
20. [Dependências](#20-dependências)
21. [Estado atual do sistema](#21-estado-atual-do-sistema)
22. [Resumo técnico final](#22-resumo-técnico-final)

---

## 1. Visão geral do sistema

### Finalidade
O **Univale Helpdesk** é um sistema de chamados de suporte. Um usuário (por exemplo, João, da Secretaria) abre um chamado
("Impressora não imprime"); a equipe de atendimento (administradores) vê todos os chamados, assume o atendimento
("Patrick está atendendo"), muda status e prioridade, registra observações e encerra. Tudo fica registrado num histórico.

### Perfis de usuário
Definidos em [backend/src/shared/auth.js:6](backend/src/shared/auth.js#L6) e espelhados em [frontend/src/lib/perfis.js:2](frontend/src/lib/perfis.js#L2):

| Perfil (valor) | Rótulo na tela | O que faz |
|---|---|---|
| `usuario` | Usuário | Abre e acompanha **os próprios** chamados |
| `admin` | Administrador | Vê e gerencia **todos** os chamados, cadastros e usuários |

### Funcionalidades principais
- Login com e-mail e senha; troca obrigatória da senha temporária no primeiro acesso; troca de senha voluntária; logout.
- Tela **Início** (dashboard) com indicadores calculados no servidor.
- **Chamados**: listar (com busca, filtros e paginação no servidor), abrir, ver detalhe, editar, cancelar, reabrir (até 7 dias),
  assumir atendimento (admin), excluir definitivamente (admin), observações (públicas ou internas) e histórico (linha do tempo).
- **Cadastros** (admin): categorias, prioridades, status e setores — criar, editar, desativar/reativar (não há exclusão).
- **Usuários** (admin): criar (com senha temporária gerada pelo sistema), editar, mudar perfil/setor, desativar/reativar, redefinir senha.
- Tema claro/escuro.

### Tecnologias
| Camada | Tecnologias |
|---|---|
| Front-end | React 18, Vite 6, Tailwind CSS 4, React Router 6, TanStack Query 5, lucide-react (ícones), clsx + tailwind-merge |
| Back-end | Node.js, Express 4, mysql2 (promise/pool), Zod, jsonwebtoken, bcryptjs, cookie-parser, cors, helmet, express-rate-limit, dotenv |
| Banco | **MySQL** (banco `helpdesk`, InnoDB, utf8mb4), SQL puro parametrizado, **sem ORM** |

### Como as camadas se comunicam
- O front-end chama a API REST por `fetch` **somente** em [frontend/src/lib/api.js](frontend/src/lib/api.js), em `http://localhost:3000/api`
  (ou `VITE_API_URL`). Envia JSON e o cabeçalho `Authorization: Bearer <token>`; usa `credentials: "include"` para o cookie de sessão.
- O back-end (Express, porta 3000) valida com Zod, confere login/perfil, aplica regras no *service* e acessa o MySQL pelo *repository*
  usando um *pool* de conexões ([backend/src/config/db.js](backend/src/config/db.js)).
- Respostas seguem um formato único: sucesso `{ data, meta?, message? }`; erro `{ error: { message, code?, details? } }`.

### Fluxo geral simplificado
```
Usuário (clica/digita)
 → Componente React (evento onClick/onSubmit/onChange)
 → Hook de dados (TanStack Query: useQuery/useMutation em features/*/api.js)
 → lib/api.js (fetch + token Bearer + cookie)
 → API Express (/api/...) → middlewares (helmet, cors, json, autenticar, exigirPerfil, validate/Zod)
 → controller → service (regras de negócio) → repository (SQL com "?")
 → MySQL
 → resposta { data, message } (ou { error })
 → TanStack Query atualiza o cache / invalida listas
 → interface re-renderiza (lista, modal, toast de sucesso/erro)
```

---

## 2. Estrutura de pastas e arquivos

```
APP - Univale - Helpdesk/
├── HARNESS.md · CLAUDE.md · AGENTS.md      regras de trabalho do projeto (CLAUDE/AGENTS só importam o HARNESS)
├── .claude/                                 automação do harness (hook de relatório, skills)
├── backend/
│   ├── package.json · .env.example · README.md
│   └── src/
│       ├── server.js                        sobe o servidor (testa o MySQL, faxina de sessões)
│       ├── app.js                           monta o Express: middlewares globais e rotas /api/*
│       ├── config/
│       │   ├── env.js                       lê o .env e valida JWT_SECRET
│       │   └── db.js                        pool mysql2 + withTransaction
│       ├── shared/
│       │   ├── auth.js                      PERFIS, gerarTokenAcesso, autenticar, exigirSenhaTrocada, exigirPerfil
│       │   ├── errors.js                    AppError, badRequest/unauthorized/..., errorHandler, rotaNaoEncontrada
│       │   ├── http.js                      ok, created, wrapAll, mergeDefined
│       │   ├── validate.js                  middleware Zod + peças (id, idParam, textoObrigatorio)
│       │   ├── senhas.js                    bcrypt (hash/conferir) + senha temporária
│       │   └── limites.js                   rate limit do login
│       └── modules/
│           ├── auth/        auth.routes · auth.controller · auth.service · sessoes.repository
│           ├── usuarios/    usuarios.routes · usuarios.controller · usuarios.service · usuarios.repository
│           ├── chamados/    chamados.routes · chamados.controller · chamados.service · chamados.repository · historico.repository
│           ├── cadastros/   cadastros.routes · cadastros.controller · cadastros.service · cadastros.repository · cadastros.tipos
│           └── dashboard/   dashboard.routes (com controller embutido) · dashboard.service · dashboard.repository
├── frontend/
│   ├── package.json · vite.config.js · jsconfig.json · index.html · .env.example · README.md
│   ├── public/icone.svg
│   └── src/
│       ├── main.jsx                         ponto de entrada (providers)
│       ├── routes.jsx                       rotas (React Router)
│       ├── index.css                        Tailwind + tema (cores em variáveis CSS, claro/escuro)
│       ├── lib/        api.js · cn.js · format.js · perfis.js · tema.js
│       ├── layouts/    AppLayout.jsx · AuthLayout.jsx
│       ├── components/ui/  Badge · Button · Card · Field · Modal · PageHeader · Paginacao · StatCard · States · Table · Toast
│       └── features/
│           ├── auth/       AuthContext · LoginPage · TrocarSenhaPage · RotasProtegidas · CampoSenha
│           ├── chamados/   ChamadosPage · api.js · permissoes.js · components/(ChamadoModal, ChamadoForm, ChamadoDetalhe, ChamadoHistorico, ChamadoBadges)
│           ├── cadastros/  CadastrosPage · CadastroForm · api.js · config.js
│           ├── usuarios/   UsuariosPage · UsuarioForm · SenhaTemporaria · api.js
│           └── dashboard/  InicioPage · BarrasPorCategoria · api.js
├── database/
│   ├── schema.sql                           script original da aula + migrações 001–004 acrescentadas (começa com DROP DATABASE)
│   ├── schema_completo.sql                  instalação nova já no formato final (sem DROP)
│   ├── migrations/  001 … 004               mudanças de banco, uma por arquivo
│   └── README.md                            índice das migrações e status de execução
└── docs/                                    SPEC, roadmap, decisões, backlog, segurança, módulos, relatórios R-NNN
```

| Pasta | Responsabilidade |
|---|---|
| `backend/src/config` | Configuração: variáveis de ambiente e conexão com o MySQL |
| `backend/src/shared` | Código comum a todos os módulos: autenticação, erros, respostas HTTP, validação, senhas, limites |
| `backend/src/modules/<m>` | Um módulo por assunto, em camadas: **routes** (URL + validação + permissão) → **controller** (HTTP) → **service** (regras) → **repository** (SQL) |
| `frontend/src/lib` | Utilitários sem tela: cliente HTTP, junção de classes, formatação, perfis, tema |
| `frontend/src/components/ui` | Componentes visuais reutilizáveis (design system próprio) |
| `frontend/src/layouts` | Moldura das páginas (logado / tela de login) |
| `frontend/src/features/<m>` | Telas e lógica de cada assunto + hooks de dados (`api.js`) |
| `database/` | Scripts SQL (o agente só propõe; quem executa é o dono) |
| `docs/` | Documentação de produto, decisões e histórico de desenvolvimento |

> Observação: existe um arquivo `backend/src/config/desktop.ini` (metadado do Google Drive, sem relação com o código).

---

## 3. Front-end React

### Onde a aplicação começa
- [frontend/index.html](frontend/index.html): tem a `<div id="root">`, carrega `/src/main.jsx` e um script inline que aplica o tema
  escuro antes de desenhar a página (lê `localStorage.tema`).
- [frontend/src/main.jsx](frontend/src/main.jsx): `createRoot(...).render(...)` envolve a aplicação em providers, nesta ordem:

```jsx
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
```

### Componente principal
`AppRoutes` em [frontend/src/routes.jsx](frontend/src/routes.jsx) — define todas as rotas. Não existe um `App.jsx`: **NÃO EXISTE NO PROJETO ATUAL**.

### Rotas (React Router 6)
| Caminho | Elemento | Proteção |
|---|---|---|
| `/login` | `LoginPage` | pública |
| `/trocar-senha` | `TrocarSenhaPage` | `RotaProtegida` (logado) |
| `/` (index) | `InicioPage` dentro de `AppLayout` | `RotaProtegida` |
| `/chamados` | `ChamadosPage` dentro de `AppLayout` | `RotaProtegida` |
| `/cadastros` | `CadastrosPage` dentro de `AppLayout` | `RotaProtegida` + `RotaAdmin` |
| `/usuarios` | `UsuariosPage` dentro de `AppLayout` | `RotaProtegida` + `RotaAdmin` |
| `*` | `NaoEncontrada` (definido em `routes.jsx`) | `RotaProtegida` |

Modais e filtros **não são rotas próprias**: ficam na *query string* (`/chamados?chamado=17&editar=1`, `/cadastros?tipo=status&item=3`,
`/usuarios?usuario=3`), lidos com `useSearchParams`.

### Organização dos componentes
- **Por feature** (`features/<modulo>/`): cada pasta tem a página, componentes específicos e `api.js` com os hooks de dados.
- **UI base** (`components/ui/`): peças visuais genéricas reutilizadas em todas as telas.
- **Layouts** (`layouts/`): `AppLayout` (sidebar + topo + `<Outlet/>`) e `AuthLayout` (tela dividida para login/troca de senha).

### Inventário de componentes

| Arquivo | Componente(s) | Responsabilidade | Relação |
|---|---|---|---|
| `routes.jsx` | `AppRoutes`, `NaoEncontrada` | Mapa de rotas; página 404 | Usa todos os layouts/páginas |
| `layouts/AppLayout.jsx` | `AppLayout`, `MenuUsuario`, `Marca`, `Navegacao` (internos) | Moldura logada: sidebar fixa (desktop), menu deslizante (celular), topo com tema e menu do usuário | Usa `useAuth`, `useTema`, `Button`; renderiza `<Outlet/>` |
| `layouts/AuthLayout.jsx` | `AuthLayout` | Tela dividida: apresentação + formulário | Usado por `LoginPage`, `TrocarSenhaPage` |
| `features/auth/AuthContext.jsx` | `AuthProvider`, `useAuth` | Estado global de login | Consumido por layouts, páginas, rotas |
| `features/auth/RotasProtegidas.jsx` | `RotaProtegida`, `RotaAdmin`, `TelaCarregando` | Guardas de rota | Usados em `routes.jsx` |
| `features/auth/LoginPage.jsx` | `LoginPage` | Formulário de login | `AuthLayout`, `Field`, `Input`, `CampoSenha`, `Button`, `Alert` |
| `features/auth/TrocarSenhaPage.jsx` | `TrocarSenhaPage` | Trocar senha (obrigatória ou voluntária) | idem + `useToast` |
| `features/auth/CampoSenha.jsx` | `CampoSenha` | Input de senha com mostrar/ocultar | Envolve `Input` |
| `features/dashboard/InicioPage.jsx` | `InicioPage`, `FilaCard` (interno) | Indicadores e chamados recentes | `StatCard`, `Card`, `CardHeader`, `BarrasPorCategoria`, badges |
| `features/dashboard/BarrasPorCategoria.jsx` | `BarrasPorCategoria` | Gráfico de barras em HTML + Tailwind | Recebe `dados` da `InicioPage` |
| `features/chamados/ChamadosPage.jsx` | `ChamadosPage`, `FiltroSelect`, `FiltroAtivo` (internos) | Lista com filtros, tabela/cartões, paginação, abre o modal | `ChamadoModal`, `Table`, `Paginacao`, `Badge`... |
| `features/chamados/components/ChamadoModal.jsx` | `ChamadoModal` | Modal em 3 modos: novo, ver, editar; ações e confirmações | `Modal`, `ChamadoForm`, `ChamadoDetalhe`, `ChamadoHistorico` |
| `features/chamados/components/ChamadoForm.jsx` | `ChamadoForm` | Formulário de abrir/editar chamado | `Field`, `Input`, `Select`, `Textarea`, `Alert` |
| `features/chamados/components/ChamadoDetalhe.jsx` | `ChamadoDetalhe`, `Item` (interno) | Exibe os dados do chamado | `StatusBadge`, `PrioridadeBadge` |
| `features/chamados/components/ChamadoHistorico.jsx` | `ChamadoHistorico` | Linha do tempo + caixa de observação | `Textarea`, `Checkbox`, `Badge`, `Button` |
| `features/chamados/components/ChamadoBadges.jsx` | `StatusBadge`, `PrioridadeBadge` | Badge com a cor vinda do cadastro | Envolvem `Badge` |
| `features/cadastros/CadastrosPage.jsx` | `CadastrosPage` | Abas + lista + modal de cadastro | `CadastroForm`, `Modal`, `Badge`... |
| `features/cadastros/CadastroForm.jsx` | `CadastroForm` | Form de um item (campos variam por tipo) | `Field`, `Input`, `Select`, `Checkbox`, `Badge` |
| `features/usuarios/UsuariosPage.jsx` | `UsuariosPage`, `Situacao`, `PerfilBadge` (internos) | Lista, filtros, modal de usuário, redefinir senha | `UsuarioForm`, `SenhaTemporaria`, `Table`, `Modal` |
| `features/usuarios/UsuarioForm.jsx` | `UsuarioForm` | Form de criar/editar usuário | `Field`, `Input`, `Select`, `Checkbox` |
| `features/usuarios/SenhaTemporaria.jsx` | `SenhaTemporaria` | Mostra a senha gerada e copia mensagem | `Alert`, `Button` |
| `components/ui/*` | ver seção 5 | Peças base | Usadas em todas as features |

### Props, State, eventos, formulários, condicionais, listas (mapa rápido)

| Recurso | Onde aparece (exemplos) |
|---|---|
| Recebem **Props** | Todos os `components/ui/*`, `AuthLayout`, `ChamadoModal`, `ChamadoForm`, `ChamadoDetalhe`, `ChamadoHistorico`, `CadastroForm`, `UsuarioForm`, `SenhaTemporaria`, `BarrasPorCategoria`, `StatusBadge`/`PrioridadeBadge`, `FiltroSelect`, `FiltroAtivo`, `FilaCard`, `Navegacao` |
| Têm **State** (`useState`) | `AuthProvider`, `ToastProvider`, `useTema`, `MenuUsuario`, `AppLayout`, `CampoSenha`, `LoginPage`, `TrocarSenhaPage`, `ChamadosPage`, `ChamadoModal`, `ChamadoForm`, `ChamadoHistorico`, `CadastroForm`, `UsuarioForm`, `UsuariosPage`, `SenhaTemporaria` |
| **Eventos** | `onClick` (botões, linhas de tabela, abas), `onChange` (inputs/selects/checkbox), `onSubmit` (todos os forms), `onMouseDown` (fundo do modal), `keydown` via `addEventListener` (Esc no modal) |
| **Formulários** (`<form onSubmit>`) | `LoginPage`, `TrocarSenhaPage`, `ChamadoForm`, `ChamadoHistorico` (observação), `CadastroForm`, `UsuarioForm` |
| **Renderização condicional** | `RotaProtegida` (carregando / sem login / senha temporária), `ChamadosPage` (pendente → erro → vazio → lista), `ChamadoModal` (modo novo/ver/editar; botões por permissão), `ehAdmin && ...` em várias telas |
| **Listas** (`.map`) | Tabela e cartões de chamados, histórico, abas e itens de cadastros, usuários, menu lateral, toasts, `<option>` dos selects, barras por categoria, recentes |
| **Navegação** | `Link`, `NavLink` (menu com estado ativo), `Navigate` (redirecionos), `useNavigate` (após login/troca de senha), `useSearchParams` (filtros/modais) |
| **Rotas protegidas** | `RotaProtegida` e `RotaAdmin` em [frontend/src/features/auth/RotasProtegidas.jsx](frontend/src/features/auth/RotasProtegidas.jsx) |
| **Usuário × admin** | `ehAdmin` do `useAuth` (menu, títulos, colunas, filtros); `permissoesChamado()` em [frontend/src/features/chamados/permissoes.js](frontend/src/features/chamados/permissoes.js) |

### Hooks utilizados

| Hook | Origem | Onde |
|---|---|---|
| `useState` | React | ver tabela acima e seção 7 |
| `useEffect` | React | `AuthProvider`, `MenuUsuario`, `Modal`, `ChamadosPage` (2×) |
| `useRef` | React | `MenuUsuario` (detectar clique fora) |
| `useContext` / `createContext` | React | `AuthContext.jsx`, `Toast.jsx` |
| `useCallback`, `useMemo` | React | `ToastProvider` |
| `useId` | React | `Field` (liga `<label htmlFor>` ao campo) |
| `useNavigate`, `useLocation` | React Router | `LoginPage`, `TrocarSenhaPage`, `RotaProtegida` |
| `useSearchParams` | React Router | `ChamadosPage`, `CadastrosPage`, `UsuariosPage` |
| `useQuery`, `useMutation`, `useQueryClient` | TanStack Query | `features/*/api.js`, `AuthProvider`, `LoginPage`, `TrocarSenhaPage` |
| **Hooks próprios** | projeto | `useAuth`, `useToast`, `useTema`, `useChamados`, `useChamado`, `useHistorico`, `useCriarChamado`, `useAtualizarChamado`, `useAssumirChamado`, `useComentarChamado`, `useReabrirChamado`, `useCancelarChamado`, `useExcluirChamado`, `useCadastro`, `useSalvarCadastro`, `useUsuarios`, `useSalvarUsuario`, `useRedefinirSenha`, `useDashboard` |

`useReducer`, `useLayoutEffect`, `useTransition`: **NÃO EXISTEM NO PROJETO ATUAL**.

---

## 4. JSX

### Exemplo 1 — Badge com renderização condicional
**Arquivo:** [frontend/src/components/ui/Badge.jsx](frontend/src/components/ui/Badge.jsx) · **Componente:** `Badge`
```jsx
<span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tons[tom], className)}>
  {ponto && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
  {children}
</span>
```
- **Representa:** uma "pílula" colorida (ex.: status "Em atendimento").
- **Elementos visuais:** fundo arredondado, bolinha opcional, texto.
- **Dados:** `tom` escolhe a cor; `ponto` liga/desliga a bolinha; `children` é o texto.

### Exemplo 2 — Linha da tabela de chamados
**Arquivo:** [frontend/src/features/chamados/ChamadosPage.jsx:208-225](frontend/src/features/chamados/ChamadosPage.jsx#L208-L225) · **Componente:** `ChamadosPage`
```jsx
{lista.map((c) => (
  <Tr key={c.id} onClick={() => abrir(c.id)}>
    <Td className="tabular-nums text-texto-suave">#{c.id}</Td>
    ...
    {ehAdmin && <Td className="text-texto-suave">{c.setor ?? "—"}</Td>}
```
- **Representa:** uma linha por chamado vindo da API.
- **Elementos:** número, título, categoria, setor/responsável (só admin), badges, data.
- **Dados:** `lista` vem de `useChamados` (dados da API); `ehAdmin` vem do contexto de autenticação; o clique muda a URL (state da URL).

### Exemplo 3 — Menu do usuário (dropdown)
**Arquivo:** [frontend/src/layouts/AppLayout.jsx:58-81](frontend/src/layouts/AppLayout.jsx#L58-L81) · **Componente:** `MenuUsuario`
```jsx
{aberto && (
  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-borda bg-superficie p-1.5 shadow-lg animate-entrar">
    <p className="truncate font-medium">{usuario.nome}</p>
    ...
    <button onClick={sair} className="... text-perigo hover:bg-perigo-suave">Sair</button>
```
- **Representa:** a caixinha que abre ao clicar no avatar.
- **Elementos:** nome, e-mail, perfil/setor, link "Trocar senha", botão "Sair".
- **Dados:** `aberto` é State local; `usuario` e `sair` vêm do `useAuth()`.

### Exemplo 4 — Linha do histórico
**Arquivo:** [frontend/src/features/chamados/components/ChamadoHistorico.jsx:22-63](frontend/src/features/chamados/components/ChamadoHistorico.jsx#L22-L63) · **Componente:** `ChamadoHistorico` (função `descrever`)
```jsx
case "status":
  return (
    <>
      {quem} mudou o status de {forte(h.valor_anterior)} para {forte(h.valor_novo)}
    </>
  );
```
- **Representa:** a frase de cada evento ("Patrick mudou o status de Aberto para Em atendimento").
- **Elementos:** Fragment (`<>`) com textos e `<strong>`.
- **Dados:** cada `h` é uma linha retornada por `GET /api/chamados/:id/historico`.

### Exemplo 5 — Página não encontrada com Props JSX
**Arquivo:** [frontend/src/routes.jsx:13-25](frontend/src/routes.jsx#L13-L25) · **Componente:** `NaoEncontrada`
```jsx
<EmptyState
  titulo="Página não encontrada"
  descricao="O endereço digitado não existe."
  acao={<Link to="/" className={classesBotao({ variante: "secundaria" })}>Voltar ao início</Link>}
/>
```
- **Representa:** estado vazio com botão de voltar.
- **Destaque:** uma Prop (`acao`) recebe **JSX** como valor; `classesBotao` dá aparência de botão a um `<Link>`.

---

## 5. Componentização

O sistema separa **peças visuais genéricas** (`components/ui`) de **componentes de negócio** (`features/*`). As telas montam a interface
combinando as peças base; cores e tamanhos vêm de Props como `variante`, `tom` e `tamanho`.

| Tipo | Caminho | Função | Reutilizado? | Props | State | Conexões |
|---|---|---|---|---|---|---|
| **Layout** | [frontend/src/layouts/AppLayout.jsx](frontend/src/layouts/AppLayout.jsx) | Sidebar, topo, `<Outlet/>` | Sim (todas as rotas logadas) | Não (é elemento de rota) | `menuAberto`; tema via `useTema` | `useAuth`, `Button`, `NavLink` |
| **Layout** | [frontend/src/layouts/AuthLayout.jsx](frontend/src/layouts/AuthLayout.jsx) | Tela dividida de login | Sim (2 páginas) | `titulo`, `descricao`, `children` | Não | `LoginPage`, `TrocarSenhaPage` |
| **Formulário (campo)** | [frontend/src/components/ui/Field.jsx](frontend/src/components/ui/Field.jsx) | `Field` (rótulo + erro + dica), `Input`, `Select`, `Textarea`, `Checkbox` | Sim (todos os forms) | `rotulo`, `erro`, `dica`, `obrigatorio`, `invalido`... | Não (`useId` só para id) | `Field` injeta `id`/`invalido` no filho com `cloneElement` |
| **Formulário (negócio)** | [frontend/src/features/chamados/components/ChamadoForm.jsx](frontend/src/features/chamados/components/ChamadoForm.jsx) | Abrir/editar chamado | Sim (modo novo e editar) | `formId`, `chamado`, `completo`, `erro`, `onSalvar` | `valores` | `ChamadoModal` (pai), `useCadastro`, `useUsuarios` |
| **Card** | [frontend/src/components/ui/Card.jsx](frontend/src/components/ui/Card.jsx) | `Card` (caixa), `CardHeader` | Sim | `className`, demais props; `titulo`, `descricao`, `acoes` | Não | Listas, dashboard, filtros |
| **Card de indicador** | [frontend/src/components/ui/StatCard.jsx](frontend/src/components/ui/StatCard.jsx) | Número + ícone; vira `Link` se tiver `para` | Sim (5× no Início) | `rotulo`, `valor`, `icone`, `tom`, `para`, `carregando` | Não | `InicioPage` |
| **Botão** | [frontend/src/components/ui/Button.jsx](frontend/src/components/ui/Button.jsx) | `Button` + `classesBotao()` | Sim (praticamente todas as telas) | `variante`, `tamanho`, `carregando`, `disabled`, `...props` | Não | Mostra `Loader2` girando quando `carregando` |
| **Modal** | [frontend/src/components/ui/Modal.jsx](frontend/src/components/ui/Modal.jsx) | Janela sobreposta (portal em `document.body`) | Sim (chamados, cadastros, usuários, senha) | `aberto`, `onFechar`, `titulo`, `descricao`, `rodape`, `tamanho`, `children` | Não (efeito para Esc e trava rolagem) | `ChamadoModal`, `CadastrosPage`, `UsuariosPage` |
| **Tabela** | [frontend/src/components/ui/Table.jsx](frontend/src/components/ui/Table.jsx) | `Table`, `Th`, `Tr`, `Td` | Sim (chamados, usuários) | `className`, `onClick` (em `Tr`) | Não | Telas de lista (desktop) |
| **Paginação** | [frontend/src/components/ui/Paginacao.jsx](frontend/src/components/ui/Paginacao.jsx) | "Mostrando 21–40 de 57" + anterior/próxima | Usado 1× (chamados) | `pagina`, `paginas`, `total`, `porPagina`, `onMudar`, `carregando` | Não | `ChamadosPage` |
| **Feedback** | [frontend/src/components/ui/States.jsx](frontend/src/components/ui/States.jsx) | `LoadingState`, `EmptyState`, `Alert` | Sim | `texto`; `icone`, `titulo`, `descricao`, `acao`; `tom`, `titulo`, `acao` | Não | Todas as telas |
| **Feedback (toast)** | [frontend/src/components/ui/Toast.jsx](frontend/src/components/ui/Toast.jsx) | Avisos no canto (somem em 4 s) | Sim (via `useToast()`) | `children` (provider) | `avisos` | Context consumido pelas telas |
| **Cabeçalho de página** | [frontend/src/components/ui/PageHeader.jsx](frontend/src/components/ui/PageHeader.jsx) | Título + descrição + ações | Sim (4 páginas) | `titulo`, `descricao`, `acoes` | Não | Páginas logadas |
| **Badge** | [frontend/src/components/ui/Badge.jsx](frontend/src/components/ui/Badge.jsx) | Pílula colorida | Sim | `tom`, `ponto`, `className`, `children` | Não | `StatusBadge`, `PrioridadeBadge`, listas |
| **Campo de senha** | [frontend/src/features/auth/CampoSenha.jsx](frontend/src/features/auth/CampoSenha.jsx) | Input com olho mostrar/ocultar | Sim (4 campos) | repassa todas (`{...props}`) | `visivel` | `LoginPage`, `TrocarSenhaPage` |
| **Gráfico** | [frontend/src/features/dashboard/BarrasPorCategoria.jsx](frontend/src/features/dashboard/BarrasPorCategoria.jsx) | Barras horizontais sem biblioteca | 1× | `dados` | Não | `InicioPage` |

---

## 6. Props

### Exemplo 1 — Página → Modal do chamado
**Arquivo:** [frontend/src/features/chamados/ChamadosPage.jsx:271-281](frontend/src/features/chamados/ChamadosPage.jsx#L271-L281)
**Pai:** `ChamadosPage` · **Filho:** `ChamadoModal`
```jsx
<ChamadoModal
  key={`${modo === "novo" ? "novo" : idAberto}`}
  modo={modo}
  id={idAberto ? Number(idAberto) : null}
  onFechar={fecharModal}
  onVer={() => alterarParams({ editar: null }, { manterPagina: true })}
  onEditar={() => alterarParams({ editar: "1" }, { manterPagina: true })}
/>
```
- **Props:** `modo` (novo/ver/editar), `id`, e três **funções de callback**.
- **Finalidade:** o pai controla a URL; o filho só pede "feche", "volte para ver" ou "vá editar". `key` força um modal novo ao trocar de chamado.

### Exemplo 2 — Modal → Formulário do chamado
**Arquivo:** [frontend/src/features/chamados/components/ChamadoModal.jsx:135-141](frontend/src/features/chamados/components/ChamadoModal.jsx#L135-L141)
**Pai:** `ChamadoModal` · **Filho:** `ChamadoForm`
```jsx
<ChamadoForm
  formId={FORM_ID}
  chamado={chamado}
  completo={pode.editarCamposDaEquipe}
  erro={atualizar.error}
  onSalvar={(dados) => atualizar.mutate({ id, dados }, { onSuccess: aoSucesso(onVer) })}
/>
```
- **Dados que descem:** o chamado atual (preenche o form), `completo` (admin vê status/setor/responsável), `erro` da API (mostra erro por campo).
- **Dados que sobem:** `onSalvar(dados)` — o form monta o objeto e o pai envia à API. `formId` liga o botão "Salvar" do rodapé do Modal ao `<form>`.

### Exemplo 3 — Página → Indicador (StatCard)
**Arquivo:** [frontend/src/features/dashboard/InicioPage.jsx:45-49](frontend/src/features/dashboard/InicioPage.jsx#L45-L49)
**Pai:** `InicioPage` · **Filho:** `StatCard`
```jsx
<StatCard rotulo={c.rotulo} valor={c.valor ?? 0} icone={c.icone} tom={c.tom} para={c.para} carregando={carregando} />
```
- **Finalidade:** o mesmo componente desenha "Abertos", "Resolvidos", "Alta prioridade"... A Prop `icone` recebe um **componente** (ícone lucide);
  `para` transforma o card em link para a lista já filtrada.

### Exemplo 4 — Modal → Histórico (permissões como Props)
**Arquivo:** [frontend/src/features/chamados/components/ChamadoModal.jsx:246](frontend/src/features/chamados/components/ChamadoModal.jsx#L246)
**Pai:** `ChamadoModal` · **Filho:** `ChamadoHistorico`
```jsx
<ChamadoHistorico chamadoId={id} podeComentar={pode.comentar} podeInterna={pode.observacaoInterna} />
```
- **Finalidade:** o pai calcula as permissões (`permissoesChamado`) e o filho só obedece: mostra ou esconde a caixa de observação e o checkbox "interna".

### Exemplo 5 — Field "clona" o filho com Props novas
**Arquivo:** [frontend/src/components/ui/Field.jsx:44-55](frontend/src/components/ui/Field.jsx#L44-L55)
**Pai:** `Field` · **Filho:** o `Input`/`Select`/`Textarea` passado como `children`
```jsx
{cloneElement(children, { id, invalido: Boolean(erro), "aria-invalid": Boolean(erro) || undefined })}
```
- **Finalidade:** quem usa escreve só `<Field rotulo="Título" erro={...}><Input .../></Field>`; o `Field` injeta o `id` (para o `<label>`) e
  a marca de inválido (borda vermelha) no campo.

**Resumo de como os dados passam:** dados **descem** por Props (objeto do chamado, listas, flags de permissão, textos); ações **sobem**
por funções passadas como Props (`onSalvar`, `onFechar`, `onMudar`, `onChange`). Dados globais (usuário logado, toast) não passam por Props:
vêm de **Context** (`useAuth`, `useToast`).

---

## 7. State e Hooks

### `useState` — onde e o que controla

| Arquivo | Estado | Controla | Categoria |
|---|---|---|---|
| [AuthContext.jsx:11-12](frontend/src/features/auth/AuthContext.jsx#L11-L12) | `usuario`, `carregando` | Quem está logado; se a sessão ainda está sendo recuperada | autenticação / loading |
| [Toast.jsx:17](frontend/src/components/ui/Toast.jsx#L17) | `avisos` | Lista de toasts visíveis | feedback |
| [lib/tema.js:5](frontend/src/lib/tema.js#L5) | `escuro` | Tema claro/escuro | interface |
| [AppLayout.jsx:29](frontend/src/layouts/AppLayout.jsx#L29) | `aberto` (MenuUsuario) | Dropdown do usuário aberto | interface |
| [AppLayout.jsx:135](frontend/src/layouts/AppLayout.jsx#L135) | `menuAberto` | Menu lateral no celular | interface/modal |
| [CampoSenha.jsx:7](frontend/src/features/auth/CampoSenha.jsx#L7) | `visivel` | Mostrar/ocultar senha | formulário |
| [LoginPage.jsx:16](frontend/src/features/auth/LoginPage.jsx#L16) | `valores` `{email, senha}` | Campos do login | formulário |
| [TrocarSenhaPage.jsx:16-17](frontend/src/features/auth/TrocarSenhaPage.jsx#L16-L17) | `valores`, `erroConfirmacao` | Campos; erro "senhas não conferem" | formulário / erro |
| [ChamadosPage.jsx:58](frontend/src/features/chamados/ChamadosPage.jsx#L58) | `textoBusca` | Texto digitado na busca (antes do *debounce*) | filtro |
| [ChamadoModal.jsx:56-57](frontend/src/features/chamados/components/ChamadoModal.jsx#L56-L57) | `confirmando`, `motivo` | Qual confirmação está aberta (cancelar/excluir/reabrir); motivo da reabertura | modal / formulário |
| [ChamadoForm.jsx:27](frontend/src/features/chamados/components/ChamadoForm.jsx#L27) | `valores` | Campos do chamado | formulário |
| [ChamadoHistorico.jsx:73-74](frontend/src/features/chamados/components/ChamadoHistorico.jsx#L73-L74) | `texto`, `interna` | Nova observação; marca de interna | formulário |
| [CadastroForm.jsx:22](frontend/src/features/cadastros/CadastroForm.jsx#L22) | `valores` | Campos do item de cadastro | formulário |
| [UsuarioForm.jsx:12](frontend/src/features/usuarios/UsuarioForm.jsx#L12) | `valores` | Campos do usuário | formulário |
| [UsuariosPage.jsx:70-71](frontend/src/features/usuarios/UsuariosPage.jsx#L70-L71) | `senhaGerada`, `confirmandoSenha` | Modal da senha temporária; confirmação de "Redefinir senha" | modal |
| [SenhaTemporaria.jsx:11](frontend/src/features/usuarios/SenhaTemporaria.jsx#L11) | `copiado` | Texto "Copiado!" por 2,5 s | feedback |

**Estados que NÃO usam `useState`** (mas são estado da aplicação):
- **Dados da API, loading e erro** → TanStack Query: `isPending`, `isError`, `error`, `isFetching`, `isPlaceholderData`, `data` (ex.: `chamados.isPending`
  em [ChamadosPage.jsx:155](frontend/src/features/chamados/ChamadosPage.jsx#L155)). Mutações: `isPending`, `error`, `reset()`.
- **Filtros, página e modal aberto** → URL (`useSearchParams`) em `ChamadosPage`, `CadastrosPage`, `UsuariosPage`.
- **Token de acesso** → variável de módulo `tokenAcesso` em [lib/api.js:18](frontend/src/lib/api.js#L18) (não é State React; não provoca re-render).

### `useEffect`

| Onde | Quando executa | O que dispara | Efeito |
|---|---|---|---|
| [AuthContext.jsx:20-27](frontend/src/features/auth/AuthContext.jsx#L20-L27) | Uma vez, ao montar (`[]`) | Abrir/recarregar a página | Registra `encerrar` como callback de sessão expirada; chama `renovarSessao()` (POST `/auth/refresh` com o cookie) e define `usuario` / `carregando=false` |
| [AppLayout.jsx:33-38](frontend/src/layouts/AppLayout.jsx#L33-L38) | Quando `aberto` muda | Abrir o menu do usuário | Adiciona listener de `mousedown` no documento para fechar ao clicar fora; remove na limpeza |
| [Modal.jsx:12-21](frontend/src/components/ui/Modal.jsx#L12-L21) | Quando `aberto`/`onFechar` mudam | Abrir o modal | Fecha com **Esc**; trava a rolagem do `body`; desfaz na limpeza |
| [ChamadosPage.jsx:59](frontend/src/features/chamados/ChamadosPage.jsx#L59) | Quando `filtros.busca` (URL) muda | Voltar/avançar no navegador, limpar filtros | Sincroniza o campo de busca com a URL |
| [ChamadosPage.jsx:60-65](frontend/src/features/chamados/ChamadosPage.jsx#L60-L65) | Quando `textoBusca` muda | Digitação | *Debounce* de 350 ms: só então grava `busca` na URL (o que dispara nova consulta) |

### Outros Hooks
| Hook | Arquivo | Finalidade |
|---|---|---|
| `useRef` | `AppLayout.jsx` (`MenuUsuario`) | Referência ao contêiner para saber se o clique foi fora |
| `useId` | `Field.jsx` | Gera `id` único para ligar `label` e campo |
| `useCallback` / `useMemo` | `Toast.jsx` | Mantêm `remover`, `mostrar` e o objeto `toast` estáveis entre renders |
| `useContext` | `AuthContext.jsx`, `Toast.jsx` | Lê o contexto (via `useAuth`/`useToast`, que lançam erro se usados fora do provider) |
| `useQuery` | `features/*/api.js` | Busca e cache de dados (lista, detalhe, histórico, cadastros, usuários, dashboard) |
| `useMutation` | `features/*/api.js`, `LoginPage`, `TrocarSenhaPage` | Operações de escrita, com `isPending`/`error` |
| `useQueryClient` | `api.js` das features, `AuthProvider` | Invalidar caches após gravar; `queryClient.clear()` no logout |
| `useNavigate` / `useLocation` | auth | Redirecionar após login; lembrar a página de origem |
| `useSearchParams` | listas | Filtros, página e modal na URL |

---

## 8. Eventos e interação

| # | Arquivo / componente | Evento | Ação | Resultado na interface |
|---|---|---|---|---|
| 1 | [LoginPage.jsx:35](frontend/src/features/auth/LoginPage.jsx#L35) `LoginPage` | `onSubmit` | `enviar` → `login.mutate(valores)` | Botão mostra *spinner*; sucesso navega para a página de origem; erro mostra `Alert` ou erro no campo |
| 2 | [LoginPage.jsx:23](frontend/src/features/auth/LoginPage.jsx#L23) | `onChange` | `alterar("email")` atualiza `valores` | Campo controlado reflete o texto |
| 3 | [ChamadosPage.jsx:105](frontend/src/features/chamados/ChamadosPage.jsx#L105) `ChamadosPage` | `onChange` (busca) | `setTextoBusca` → debounce 350 ms → URL | Lista refeita no servidor; contador "x chamados encontrados" |
| 4 | [ChamadosPage.jsx:111](frontend/src/features/chamados/ChamadosPage.jsx#L111) | `onChange` (select Situação) | `alterarParams({ situacao })` | URL muda, volta para página 1, lista filtrada |
| 5 | [ChamadosPage.jsx:146](frontend/src/features/chamados/ChamadosPage.jsx#L146) | `onClick` "Limpar filtros" | `limparFiltros()` | Remove todos os filtros da URL |
| 6 | [ChamadosPage.jsx:91](frontend/src/features/chamados/ChamadosPage.jsx#L91) | `onClick` "Abrir chamado" | `alterarParams({ novo: "1" })` | Abre o modal "Abrir chamado" |
| 7 | [ChamadosPage.jsx:209](frontend/src/features/chamados/ChamadosPage.jsx#L209) | `onClick` na linha (`Tr`) | `abrir(c.id)` → `?chamado=ID` | Abre o modal de detalhe |
| 8 | [Modal.jsx:26,31,42](frontend/src/components/ui/Modal.jsx#L26) `Modal` | `onMouseDown` no fundo, `stopPropagation` na janela, `onClick` no X, tecla Esc | `onFechar()` | Fecha o modal (remove parâmetros da URL) |
| 9 | [ChamadoModal.jsx:207](frontend/src/features/chamados/components/ChamadoModal.jsx#L207) | `onClick` "Assumir atendimento" | `assumir.mutate(id)` | Toast "Você assumiu o chamado #ID"; status/responsável e histórico atualizados |
| 10 | [ChamadoModal.jsx:188](frontend/src/features/chamados/components/ChamadoModal.jsx#L188) | `onClick` "Cancelar chamado" | `setConfirmando("cancelar")` | Mostra `Alert` de confirmação e troca o rodapé |
| 11 | [ChamadoModal.jsx:174](frontend/src/features/chamados/components/ChamadoModal.jsx#L174) | `onClick` botão de confirmação | `acoesConfirmadas[confirmando]()` | Executa cancelar/excluir/reabrir; toast de sucesso ou erro |
| 12 | [ChamadoHistorico.jsx:145](frontend/src/features/chamados/components/ChamadoHistorico.jsx#L145) | `onSubmit` observação | `comentar.mutate({ id, texto, interna })` | Toast; limpa o campo; nova linha no histórico |
| 13 | [ChamadoForm.jsx:71](frontend/src/features/chamados/components/ChamadoForm.jsx#L71) | `onSubmit` | monta `dados` e chama `onSalvar` | Pai envia POST/PATCH |
| 14 | **Alteração de status** | `onChange` no select "Status" do `ChamadoForm` (só admin) + `onSubmit` | PATCH `/chamados/:id` com `status_id` | Badge e histórico ("mudou o status de ... para ...") |
| 15 | [CadastrosPage.jsx:74](frontend/src/features/cadastros/CadastrosPage.jsx#L74) | `onClick` aba | `setParams({ tipo })` | Troca a lista (categorias/prioridades/status/setores) |
| 16 | [CadastrosPage.jsx:137](frontend/src/features/cadastros/CadastrosPage.jsx#L137) | `onClick` "Desativar/Reativar" | `alternarAtivo(item)` → PATCH `{ ativo }` | Toast; item fica esmaecido com badge "Inativo" |
| 17 | [UsuariosPage.jsx:140](frontend/src/features/usuarios/UsuariosPage.jsx#L140) | `onChange` busca de usuários | `alterarParams({ busca }, { replace: true })` | Filtra **no navegador** (função `filtrar`) |
| 18 | [UsuariosPage.jsx:272](frontend/src/features/usuarios/UsuariosPage.jsx#L272) | `onClick` "Redefinir senha" | `setConfirmandoSenha(true)` → `aoRedefinir()` | Modal com a nova senha temporária |
| 19 | [SenhaTemporaria.jsx:39](frontend/src/features/usuarios/SenhaTemporaria.jsx#L39) | `onClick` copiar | `navigator.clipboard.writeText` | Botão vira "Copiado!" |
| 20 | [AppLayout.jsx:171](frontend/src/layouts/AppLayout.jsx#L171) | `onClick` sol/lua | `alternarTema()` | Alterna classe `.dark` no `<html>` e salva em `localStorage` |
| 21 | [CampoSenha.jsx:13](frontend/src/features/auth/CampoSenha.jsx#L13) | `onClick` olho | `setVisivel(v => !v)` | Campo alterna `password`/`text` |
| 22 | [Paginacao.jsx:19,26](frontend/src/components/ui/Paginacao.jsx#L19) | `onClick` Anterior/Próxima | `onMudar(pagina ± 1)` | URL `?pagina=N`, rola ao topo |

Trecho representativo (debounce da busca, [ChamadosPage.jsx:60-65](frontend/src/features/chamados/ChamadosPage.jsx#L60-L65)):
```jsx
useEffect(() => {
  if (textoBusca === filtros.busca) return;
  const espera = setTimeout(() => alterarParams({ busca: textoBusca }, { replace: true }), 350);
  return () => clearTimeout(espera);
}, [textoBusca]);
```

---

## 9. Tailwind CSS

### Configuração
- **Tailwind 4** via plugin do Vite: [frontend/vite.config.js](frontend/vite.config.js) (`plugins: [react(), tailwindcss()]`).
- **Não existe `tailwind.config.js`** nem `postcss.config.js`: **NÃO EXISTE NO PROJETO ATUAL** (Tailwind 4 configura no CSS).
- [frontend/src/index.css](frontend/src/index.css):
  - `@import "tailwindcss";`
  - `@custom-variant dark (&:where(.dark, .dark *));` — modo escuro pela classe `.dark` no `<html>`.
  - Cores como **variáveis CSS** em `:root` (claro) e `.dark` (escuro), expostas ao Tailwind com `@theme inline`
    (`--color-primaria: var(--primaria)` → classes `bg-primaria`, `text-primaria`...).
  - Sombra própria `shadow-cartao`, fonte `font-sans` e animação `animate-entrar` (keyframes).
- União de classes com `cn()` ([frontend/src/lib/cn.js](frontend/src/lib/cn.js)) = `clsx` + `tailwind-merge` (se duas classes brigam, vale a última).

### Onde as classes aparecem
Diretamente no JSX (`className="..."`) em todos os componentes; variações guardadas em objetos JS (ex.: `variantes` e `tamanhos` no `Button`,
`tons` no `Badge`) e combinadas com `cn()`. Um único estilo inline existe para valor dinâmico: a largura da barra em
[BarrasPorCategoria.jsx:37](frontend/src/features/dashboard/BarrasPorCategoria.jsx#L37) (`style={{ width: ... }}`).

### Como cada aspecto é tratado
| Aspecto | Como | Exemplo real |
|---|---|---|
| Espaçamento | `p-*`, `px-*`, `py-*`, `gap-*`, `mt-*`, `mb-*` | `px-5 py-4` (cabeçalho do Modal) |
| Cores | Somente nomes do tema (`bg-superficie`, `text-texto-suave`, `border-borda`, `bg-primaria-suave`...) | `bg-perigo-suave text-perigo` |
| Tipografia | `text-sm`, `text-[15px]`, `text-2xl`, `font-medium/semibold`, `tracking-tight`, `uppercase`, `tabular-nums`, `truncate` | `text-xs font-semibold uppercase tracking-wide` (`Th`) |
| Flexbox | `flex`, `items-center`, `justify-between`, `flex-col`, `flex-wrap`, `shrink-0`, `flex-1` | `flex items-start justify-between gap-4` |
| Grid | `grid`, `grid-cols-*`, `col-span-*`, colunas arbitrárias | `grid gap-3 sm:grid-cols-2 lg:grid-cols-4` (filtros) |
| Responsividade | *mobile-first* com `sm:`, `md:`, `lg:`; tabela no desktop (`hidden md:block`) e cartões no celular (`md:hidden`) | `lg:pl-64`, `hidden ... lg:flex` (sidebar) |
| Hover | `hover:bg-superficie-2`, `hover:text-texto`, `hover:border-primaria`, `hover:underline` | linhas clicáveis, botões |
| Focus | `focus:border-primaria focus:ring-3 focus:ring-primaria-suave` (campos); `focus-visible:outline-*` (botões) | `baseCampo` em `Field.jsx` |
| Estados visuais | `disabled:opacity-60`, `disabled:pointer-events-none`, `aria-invalid` + classes de inválido, `active:bg-superficie-2`, `animate-spin`, `animate-pulse` (esqueleto), `opacity-60` em lista desatualizada | `Button`, `StatCard` |
| Dark mode | Existe. Classe `.dark` no `<html>` troca os valores das variáveis; as telas **não usam `dark:`** | `index.css` + `lib/tema.js` |

### Exemplos comentados
| # | Classe(s) | O que faz | Conceito CSS | Componente |
|---|---|---|---|---|
| 1 | `grid min-h-dvh lg:grid-cols-2` | Grade que ocupa a altura da tela; 2 colunas a partir de 1024 px | CSS Grid + media query + unidade `dvh` | `AuthLayout` |
| 2 | `fixed inset-y-0 left-0 hidden w-64 flex-col ... lg:flex` | Sidebar fixa à esquerda, escondida no celular e visível no desktop | `position: fixed`, `display`, breakpoint | `AppLayout` |
| 3 | `sticky top-0 z-30 ... bg-superficie/85 backdrop-blur` | Topo que gruda ao rolar, fundo 85 % opaco com desfoque | `position: sticky`, `z-index`, opacidade de cor, `backdrop-filter` | `AppLayout` |
| 4 | `focus:border-primaria focus:outline-none focus:ring-3 focus:ring-primaria-suave` | Destaque do campo com foco (anel suave) | pseudo-classe `:focus`, `box-shadow` (ring) | `Field.jsx` (`baseCampo`) |
| 5 | `disabled:pointer-events-none disabled:opacity-60` | Botão desabilitado fica apagado e não clica | pseudo-classe `:disabled`, `opacity`, `pointer-events` | `Button` |
| 6 | `fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center` | Fundo escuro do modal; janela embaixo no celular e centralizada no desktop | Flexbox + overlay + responsividade | `Modal` |
| 7 | `before:absolute before:inset-y-2 before:left-4 before:w-px before:bg-borda` | Linha vertical da linha do tempo desenhada com pseudo-elemento | `::before`, `position: absolute` | `ChamadoHistorico` |
| 8 | `even:bg-superficie-2/40 ... hover:bg-primaria-suave` | Linhas zebradas e destaque ao passar o mouse | `:nth-child(even)`, `:hover` | `Tr` (`Table.jsx`) |

---

## 10. Formulários

Padrão comum: campos **controlados** (`value` + `onChange` atualizando um objeto `valores`), `e.preventDefault()` no envio, validação
**HTML5** no navegador (`required`, `maxLength`, `type="email"`, `min/max`) + **Zod no servidor**. Erros de validação da API chegam como
`error.details = [{ campo, mensagem }]` e são convertidos em `errosCampo` para aparecer embaixo de cada `Field`; outros erros aparecem num `Alert`.

### 10.1 Login
- **Arquivo:** [frontend/src/features/auth/LoginPage.jsx](frontend/src/features/auth/LoginPage.jsx)
- **Campos:** `email`, `senha` (via `CampoSenha`).
- **Estados:** `valores`; mutação `login` (`useMutation({ mutationFn: entrar })`).
- **Eventos:** `onChange` por campo; `onSubmit={enviar}`.
- **Validações:** front: `type="email"`, `required`. Back: `loginSchema` (e-mail válido, minúsculo; senha obrigatória) + *rate limit*.
- **Envio / API:** `entrar()` do `AuthContext` → `POST /api/auth/login`.
- **Sucesso:** guarda o token em memória, `setUsuario`, navega para `local.state.de.pathname` ou `/`.
- **Erro:** `Alert tom="perigo"` com a mensagem ("E-mail ou senha incorretos.", "Usuário desativado...", "Muitas tentativas..."), ou erro por campo.

### 10.2 Trocar senha (primeiro acesso ou voluntária)
- **Arquivo:** [frontend/src/features/auth/TrocarSenhaPage.jsx](frontend/src/features/auth/TrocarSenhaPage.jsx)
- **Campos:** `senha_atual`, `nova_senha`, `confirmacao`.
- **Estados:** `valores`, `erroConfirmacao`; mutação `troca`.
- **Validações:** front: `minLength={8}`, confirmação igual (só na tela). Back: `trocarSenhaSchema` (8–72 caracteres, pelo menos 1 letra e 1 número);
  service confere a senha atual e exige senha diferente.
- **Envio / API:** `PATCH /api/auth/senha`.
- **Sucesso:** novo token (sem a marca `trocar_senha`), `setUsuario`, toast, navega para `/`.
- **Erro:** `Alert` ou erro por campo.

### 10.3 Abrir / editar chamado
- **Arquivo:** [frontend/src/features/chamados/components/ChamadoForm.jsx](frontend/src/features/chamados/components/ChamadoForm.jsx) (dentro de `ChamadoModal`)
- **Campos:** `titulo`, `categoria_id`, `prioridade_id`, `descricao`; se `completo` (admin editando): `status_id`, `setor_id`, `usuario_responsavel_id`.
- **Estados:** `valores`; consultas `useCadastro` (categorias, prioridades, status, setores) e `useUsuarios({ enabled: completo })`.
- **Validações:** front: `required`, `maxLength` 150/5000. Back: `criarSchema`/`atualizarSchema` (Zod); service: cadastro existe e está ativo,
  responsável é admin ativo, usuário comum só altera os 4 campos enquanto o chamado está "aberto".
- **Envio / API:** novo → `POST /api/chamados`; edição → `PATCH /api/chamados/:id`. O botão de envio fica no rodapé do `Modal` e aponta para o form com `form={FORM_ID}`.
- **Sucesso:** toast com a `message` da API; novo fecha o modal, edição volta ao modo "ver"; listas e dashboard são invalidados.
- **Erro:** `Alert` no topo do form ou mensagem embaixo do campo.

### 10.4 Observação no histórico
- **Arquivo:** [frontend/src/features/chamados/components/ChamadoHistorico.jsx](frontend/src/features/chamados/components/ChamadoHistorico.jsx)
- **Campos:** `texto` (textarea), `interna` (checkbox, só admin).
- **Validações:** `required`, `maxLength=5000`, botão desabilitado se `!texto.trim()`; back: `observacaoSchema`; usuário comum não comenta em chamado cancelado.
- **API:** `POST /api/chamados/:id/observacoes`.
- **Sucesso:** toast, limpa `texto` e `interna`. **Erro:** `Alert` acima do campo.

### 10.5 Motivo da reabertura
- **Arquivo:** [ChamadoModal.jsx:224-228](frontend/src/features/chamados/components/ChamadoModal.jsx#L224-L228) — não é um `<form>`; é um `Textarea` com estado `motivo` e botão de confirmação.
- **Validação:** botão desabilitado sem motivo; back: `reabrirSchema` (até 1000 caracteres) e prazo de 7 dias para não admin.
- **API:** `POST /api/chamados/:id/reabrir`. **Sucesso:** toast, fecha a confirmação. **Erro:** toast de erro.

### 10.6 Cadastro auxiliar (categoria, prioridade, status, setor)
- **Arquivo:** [frontend/src/features/cadastros/CadastroForm.jsx](frontend/src/features/cadastros/CadastroForm.jsx)
- **Campos:** `nome`, `ativo`; prioridades: `nivel`, `cor`; status: `tipo`, `cor`, `ordem`, `inicial`.
- **Validações:** front: `required`, `min/max`; campos travados se o item é o status inicial. Back: schemas por tipo (nível 1–9, ordem 0–999,
  cor/tipo em lista fixa) + regras do status inicial (único, ativo, tipo "aberto"); nome repetido → 409.
- **API:** novo → `POST /api/cadastros/:tipo`; edição → `PATCH /api/cadastros/:tipo/:id`.
- **Sucesso:** toast, fecha o modal, invalida o cadastro e os chamados. **Erro:** `Alert`/erro por campo.
- **Extra:** prévia ao vivo do badge com nome e cor.

### 10.7 Usuário
- **Arquivo:** [frontend/src/features/usuarios/UsuarioForm.jsx](frontend/src/features/usuarios/UsuarioForm.jsx)
- **Campos:** `nome`, `email`, `perfil`, `setor_id`; na edição, `ativo`.
- **Validações:** front: `required`, `maxLength`, `type="email"`; perfil e ativo travados quando o admin edita a si mesmo. Back: schema Zod;
  e-mail único; não pode tirar o próprio perfil de admin nem se desativar; sempre resta ≥1 admin ativo; setor ativo.
- **API:** novo → `POST /api/usuarios` (resposta traz `senha_temporaria`); edição → `PATCH /api/usuarios/:id`.
- **Sucesso:** toast, fecha o modal; na criação abre o modal `SenhaTemporaria`. **Erro:** `Alert`/erro por campo.

### 10.8 Filtros (não são `<form>`)
- **Chamados:** busca + selects (situação, status, prioridade, categoria; admin: setor e responsável) → URL → **filtragem no servidor**.
- **Usuários:** busca + perfil + situação → URL → **filtragem no navegador** (`filtrar()` em [UsuariosPage.jsx:29-37](frontend/src/features/usuarios/UsuariosPage.jsx#L29-L37)).

### Cadastro público de usuário (auto-registro)
**NÃO EXISTE NO PROJETO ATUAL.** Usuários são criados apenas pelo administrador (tela de login diz "Procure o administrador").

---

## 11. Autenticação e perfis

### Cadastro de usuário
Somente o **administrador** cria usuários (`POST /api/usuarios`). O back gera uma **senha temporária** de 10 caracteres
([backend/src/shared/senhas.js:26](backend/src/shared/senhas.js#L26)), grava só o **hash bcrypt** (custo 10) e marca `trocar_senha = TRUE`.
A senha aparece **uma única vez** para o admin repassar.

### Login
1. `LoginPage` → `entrar({ email, senha })` → `POST /api/auth/login`.
2. Rota: *rate limit* (10 erros por IP+e-mail e 100 por IP a cada 15 min, [shared/limites.js](backend/src/shared/limites.js)) → Zod.
3. `auth.service.login`: busca por e-mail, compara com bcrypt (se o e-mail não existe, compara com um `HASH_FALSO` para levar o mesmo tempo),
   mesma mensagem para e-mail inexistente e senha errada; recusa usuário desativado; registra `ultimo_acesso`.
4. `criarSessao`: gera **JWT de acesso** (HS256, 15 min, payload `sub, nome, perfil, trocar_senha`) e **refresh token** aleatório (96 hex);
   grava em `sessoes` só o **SHA-256** do refresh token, com validade de 7 dias.
5. Resposta: corpo `{ token, usuario }` + cookie `helpdesk_sessao` (**httpOnly**, `sameSite: lax`, `secure` em produção, `path: /api/auth`).

### Armazenamento
| O quê | Onde | Observação |
|---|---|---|
| Token de acesso (JWT) | **Memória** do JavaScript (`let tokenAcesso` em [lib/api.js:18](frontend/src/lib/api.js#L18)) | Some ao recarregar |
| Refresh token | **Cookie httpOnly** `helpdesk_sessao` | O JavaScript não lê |
| Usuário logado | State `usuario` no `AuthProvider` | — |
| `localStorage` | **Só o tema** (`tema`) | Nada de autenticação no `localStorage`/`sessionStorage` |

### Identificação do usuário logado
- **Front:** `useAuth()` devolve `{ usuario, carregando, ehAdmin, entrar, sair, trocarSenha }`.
- **Back:** middleware `autenticar` lê `Authorization: Bearer`, verifica assinatura/validade e preenche `req.usuario = { id, nome, perfil, trocar_senha }`.
- Ao recarregar a página, o `AuthProvider` chama `POST /api/auth/refresh` (cookie) e recupera `{ token, usuario }`.

### Renovação automática
`api()` em [lib/api.js:77-91](frontend/src/lib/api.js#L77-L91): se uma chamada responde **401** (e não é `/auth/*`), chama `renovarSessao()` e repete
a requisição uma vez. Renovações simultâneas compartilham a mesma promessa (`renovacaoEmAndamento`), porque o servidor **rotaciona** o refresh
token (revoga o antigo a cada renovação). Se a renovação falha, chama `aoExpirarSessao()` → `encerrar()` (zera usuário e cache) → as rotas
protegidas redirecionam ao login.

### Logout
`sair()` → `POST /api/auth/logout` (revoga a sessão pelo hash do cookie e apaga o cookie) → `encerrar()`: `definirToken(null)`,
`setUsuario(null)`, `queryClient.clear()` (não deixa dados para o próximo usuário).

### Proteção de rotas e redirecionamentos
| Situação | Front ([RotasProtegidas.jsx](frontend/src/features/auth/RotasProtegidas.jsx)) | Back |
|---|---|---|
| Sessão sendo recuperada | `TelaCarregando` | — |
| Sem login | `<Navigate to="/login" state={{ de: local }}>`; após login volta à página de origem | `autenticar` → 401 |
| Senha temporária | Força `/trocar-senha` | `exigirSenhaTrocada` → 403 `TROCAR_SENHA` em `/chamados`, `/cadastros`, `/dashboard`, `/usuarios` |
| Já logado abrindo `/login` | `<Navigate to="/">` | — |
| Não admin em `/cadastros` ou `/usuarios` | `RotaAdmin` → `<Navigate to="/">` | `exigirPerfil('admin')` → 403 |

### Permissões (usuário × administrador)
- **Servidor** (fonte da verdade): rotas com `exigirPerfil(PERFIS.ADMIN)` (usuários; POST/PATCH de cadastros; assumir e excluir chamado) e regras no
  [chamados.service.js](backend/src/modules/chamados/chamados.service.js) (dono só vê os próprios; edita/cancela só se "aberto"; reabre até 7 dias;
  não vê observações internas; não altera status/setor/responsável).
- **Tela** (só conforto): `permissoesChamado()` em [permissoes.js](frontend/src/features/chamados/permissoes.js) decide quais botões aparecem;
  menu filtrado por `perfis` em [AppLayout.jsx:11-17](frontend/src/layouts/AppLayout.jsx#L11-L17).
- Mudança de perfil ou desativação revoga todas as sessões do usuário (o token atual vale até vencer, no máximo 15 min).

### Fluxo
```
Login (LoginPage, onSubmit)
 → validação (HTML5 no navegador; rate limit + Zod no servidor)
 → autenticação (bcrypt.compare; usuário ativo?)
 → armazenamento (JWT em memória + refresh token em cookie httpOnly + hash do refresh na tabela sessoes)
 → acesso às páginas (RotaProtegida/RotaAdmin na tela; autenticar/exigirSenhaTrocada/exigirPerfil na API;
                       401 → POST /auth/refresh automático)
 → logout (POST /auth/logout revoga a sessão e apaga o cookie; front limpa token, usuário e cache)
```

---

## 12. Visão do usuário

Exemplo: **João, da Secretaria** (perfil `usuario`).

| Etapa | Página / componente | Rota | Chamadas à API | Dados usados |
|---|---|---|---|---|
| Cadastro | — (feito pelo admin) | — | — | **Auto-cadastro NÃO EXISTE** |
| Login | `LoginPage` | `/login` | `POST /auth/login` | e-mail, senha |
| Primeiro acesso | `TrocarSenhaPage` | `/trocar-senha` (obrigatória) | `PATCH /auth/senha` | senha temporária, nova senha |
| Dashboard | `InicioPage` | `/` | `GET /dashboard` | Só os chamados dele: "Meus chamados", Abertos, Em atendimento, Resolvidos, Alta prioridade, por categoria, 6 recentes |
| Meus chamados | `ChamadosPage` (título "Meus chamados") | `/chamados` | `GET /chamados?...`, `GET /cadastros/status|prioridades|categorias|setores` | Busca (nº, título, descrição), situação, status, prioridade, categoria; paginação 20/página |
| Abrir chamado | `ChamadoModal` modo novo + `ChamadoForm` | `/chamados?novo=1` | `POST /chamados` | título, categoria, prioridade, descrição (setor e solicitante vêm do cadastro dele; status = inicial) |
| Ver detalhe | `ChamadoModal` modo ver + `ChamadoDetalhe` + `ChamadoHistorico` | `/chamados?chamado=ID` | `GET /chamados/:id`, `GET /chamados/:id/historico` | Dados, responsável, datas; histórico **sem** observações internas |
| Acompanhar status | Badges + histórico | — | — | `status`, `status_cor`, linhas do histórico |
| Editar | `ChamadoModal` modo editar | `/chamados?chamado=ID&editar=1` | `PATCH /chamados/:id` | Só os 4 campos e **só enquanto o status é do tipo "aberto"** |
| Cancelar | Botão "Cancelar chamado" | — | `POST /chamados/:id/cancelar` | Só enquanto "aberto" |
| Enviar mensagem | `ChamadoHistorico` | — | `POST /chamados/:id/observacoes` | Texto (nunca interna); não em chamado cancelado |
| Reabrir | Botão "Reabrir" + motivo | — | `POST /chamados/:id/reabrir` | Só "resolvido" e até 7 dias após o encerramento |
| Trocar senha | Menu do usuário → `TrocarSenhaPage` | `/trocar-senha` | `PATCH /auth/senha` | — |
| Tema | Botão sol/lua | — | — | `localStorage.tema` |
| Logout | Menu do usuário → "Sair" | → `/login` | `POST /auth/logout` | — |

Itens de menu visíveis: **Início** e **Meus chamados**. Excluir e assumir **não aparecem** para ele.

---

## 13. Visão do administrador

Exemplo: **Patrick, da TI** (perfil `admin`).

| Funcionalidade | Página / componente | Rota | API | Permissão |
|---|---|---|---|---|
| Login / troca de senha | `LoginPage`, `TrocarSenhaPage` | `/login`, `/trocar-senha` | `/auth/*` | pública / logado |
| Dashboard | `InicioPage` (+ `FilaCard` "Meus atendimentos" e "Sem responsável") | `/` | `GET /dashboard` | logado; conteúdo varia por perfil no service |
| Todos os chamados | `ChamadosPage` (título "Chamados"; colunas Setor e Responsável) | `/chamados` | `GET /chamados` | service não restringe ao dono |
| Filtros | Busca (inclui nome do solicitante), situação, status, prioridade, categoria, **setor**, **responsável** (eu / nenhum / outro admin); `tipo` e `alta` vindos dos cards | `/chamados?...` | `GET /chamados?...` | logado (filtros extras só aparecem para admin) |
| Assumir atendimento | `ChamadoModal` → "Assumir atendimento" | — | `POST /chamados/:id/assumir` | `exigirPerfil('admin')` na rota |
| Alterar status / prioridade / setor / responsável | `ChamadoForm` com `completo` | `?chamado=ID&editar=1` | `PATCH /chamados/:id` | service: só admin altera status/setor/responsável |
| Atribuir responsável | Select "Responsável" (admins ativos) | — | `PATCH /chamados/:id` `{ usuario_responsavel_id }` | service: precisa ser admin ativo |
| Observação interna | `ChamadoHistorico` + checkbox | — | `POST /chamados/:id/observacoes` `{ interna: true }` | `interna` só vale para admin |
| Histórico completo | `ChamadoHistorico` | — | `GET /chamados/:id/historico` | admin vê internas |
| Cancelar / reabrir | `ChamadoModal` | — | `POST .../cancelar`, `.../reabrir` | admin: qualquer status (cancelar) e sem prazo (reabrir) |
| Excluir definitivamente | Ícone de lixeira + confirmação | — | `DELETE /chamados/:id` | `exigirPerfil('admin')`; histórico apagado em cascata |
| Gestão de usuários | `UsuariosPage`, `UsuarioForm`, `SenhaTemporaria` | `/usuarios` | `GET/POST /usuarios`, `PATCH /usuarios/:id`, `POST /usuarios/:id/redefinir-senha` | `RotaAdmin` + `exigirPerfil` no `app.js` |
| Categorias / prioridades / status / setores | `CadastrosPage` (abas) + `CadastroForm` | `/cadastros?tipo=...` | `GET/POST /cadastros/:tipo`, `PATCH /cadastros/:tipo/:id` | `RotaAdmin`; POST/PATCH com `exigirPerfil` |

Itens de menu: **Início**, **Chamados**; seção **Administração**: **Usuários**, **Cadastros**.

Regras administrativas relevantes:
- **Cadastros não são apagados** (não há DELETE): desativar (`ativo=false`) tira o item das listas de escolha; chamados antigos mantêm o valor.
- Status têm **tipo** (aberto/andamento/resolvido/cancelado), **inicial** (exatamente um, ativo, tipo aberto), **cor** e **ordem**; prioridades têm **nível** (1–9; o maior é "alta") e **cor**.
- Usuário **não é apagado** (não há DELETE): desativa-se. Não é possível tirar o próprio perfil admin, desativar a si mesmo, nem deixar o sistema sem admin ativo.

---

## 14. Integração com API

### Onde ficam as chamadas HTTP
- **Cliente único:** [frontend/src/lib/api.js](frontend/src/lib/api.js) — função `requisitar` (fetch, JSON, `Authorization`, `credentials: "include"`,
  conversão de erro em `ApiError { message, status, code, details }`) e `api()` (com renovação automática no 401).
- **Hooks por feature:** `features/chamados/api.js`, `features/cadastros/api.js`, `features/usuarios/api.js`, `features/dashboard/api.js`.
  O `AuthContext` chama `api()` diretamente para `/auth/*`.
- As telas **não** usam `fetch` nem `useEffect` para buscar dados.

### Endpoints usados pelo front-end
| Método | Endpoint | Hook / função | Arquivo | Componente / página |
|---|---|---|---|---|
| POST | `/auth/login` | `entrar` | `AuthContext.jsx` | `LoginPage` |
| POST | `/auth/refresh` | `renovarSessao` | `lib/api.js` | `AuthProvider` (ao abrir) e qualquer 401 |
| POST | `/auth/logout` | `sair` | `AuthContext.jsx` | `MenuUsuario`, `TrocarSenhaPage` |
| PATCH | `/auth/senha` | `trocarSenha` | `AuthContext.jsx` | `TrocarSenhaPage` |
| GET | `/dashboard` | `useDashboard` | `dashboard/api.js` | `InicioPage` |
| GET | `/chamados?filtros&pagina&por_pagina` | `useChamados` | `chamados/api.js` | `ChamadosPage` |
| GET | `/chamados/:id` | `useChamado` | `chamados/api.js` | `ChamadoModal` |
| GET | `/chamados/:id/historico` | `useHistorico` | `chamados/api.js` | `ChamadoHistorico` |
| POST | `/chamados` | `useCriarChamado` | `chamados/api.js` | `ChamadoModal` (novo) |
| PATCH | `/chamados/:id` | `useAtualizarChamado` | `chamados/api.js` | `ChamadoModal` (editar) |
| POST | `/chamados/:id/assumir` | `useAssumirChamado` | `chamados/api.js` | `ChamadoModal` |
| POST | `/chamados/:id/observacoes` | `useComentarChamado` | `chamados/api.js` | `ChamadoHistorico` |
| POST | `/chamados/:id/reabrir` | `useReabrirChamado` | `chamados/api.js` | `ChamadoModal` |
| POST | `/chamados/:id/cancelar` | `useCancelarChamado` | `chamados/api.js` | `ChamadoModal` |
| DELETE | `/chamados/:id` | `useExcluirChamado` | `chamados/api.js` | `ChamadoModal` |
| GET | `/cadastros/:tipo` | `useCadastro` | `cadastros/api.js` | `ChamadosPage`, `ChamadoForm`, `CadastrosPage`, `UsuarioForm` |
| POST / PATCH | `/cadastros/:tipo` · `/cadastros/:tipo/:id` | `useSalvarCadastro` | `cadastros/api.js` | `CadastrosPage` |
| GET | `/usuarios` | `useUsuarios` | `usuarios/api.js` | `UsuariosPage`; `ChamadosPage` e `ChamadoForm` (só admin) |
| POST / PATCH | `/usuarios` · `/usuarios/:id` | `useSalvarUsuario` | `usuarios/api.js` | `UsuariosPage` |
| POST | `/usuarios/:id/redefinir-senha` | `useRedefinirSenha` | `usuarios/api.js` | `UsuariosPage` |

**Métodos em uso:** GET, POST, PATCH, DELETE. **PUT: NÃO EXISTE NO PROJETO ATUAL.**

### Envio, respostas, erros, loading e atualização
- **Envio:** corpo `JSON.stringify(body)` com `Content-Type: application/json`; filtros por `URLSearchParams` (vazios são removidos).
- **Respostas:** o cliente devolve o corpo `{ data, meta?, message? }`; os hooks costumam extrair `r.data`. A `message` da API vira o texto do toast.
- **Erros:** status ≠ 2xx vira `ApiError`. Falha de rede: "Não foi possível conectar à API. Ela está rodando?". `details` → erro por campo; demais → `Alert`/toast.
- **Loading:** `isPending` (primeira carga → `LoadingState` / `StatCard` com esqueleto), `isFetching` (" · atualizando..."), `isPlaceholderData`
  (lista anterior com `opacity-60` enquanto chega a nova, graças a `keepPreviousData`), botões com `carregando={mutation.isPending}`.
- **Atualização após gravar:** `invalidateQueries` — chamados invalidam `["chamados"]` e `["dashboard"]`; cadastros invalidam `["cadastros", tipo]` e
  `["chamados"]`; usuários invalidam `["usuarios"]` e `["chamados"]`. O histórico usa a chave `["chamados", id, "historico"]`, então é atualizado junto.
- **Cache:** `staleTime` 30 s (global, em `main.jsx`), 5 min para cadastros; `retry: 1`; sem refetch ao focar a janela.

---

## 15. Back-end

### Estrutura e arquivo principal
- **Entrada:** [backend/src/server.js](backend/src/server.js) — carrega `env` primeiro, testa o MySQL (sai com erro se falhar), sobe na porta `PORT` (3000) e agenda a
  faxina diária de sessões antigas (`limparSessoesAntigas`, 30 dias).
- **App:** [backend/src/app.js](backend/src/app.js) — middlewares globais e montagem das rotas.
- Scripts: `npm start` (node) e `npm run dev` (nodemon).

### Middlewares
| Middleware | Arquivo | Função |
|---|---|---|
| `helmet()` | `app.js:21` | Cabeçalhos de segurança |
| `cors({ origin: FRONTEND_URL, credentials: true })` | `app.js:23` | Só o front configurado, com cookie |
| `express.json({ limit: "100kb" })` | `app.js:25` | Corpo JSON até 100 KB |
| `cookieParser()` | `app.js:26` | Lê o cookie de sessão |
| `autenticar` | `shared/auth.js:20` | Exige JWT válido |
| `exigirSenhaTrocada` | `shared/auth.js:36` | Bloqueia quem tem senha temporária |
| `exigirPerfil(...)` | `shared/auth.js:42` | Exige perfil |
| `validate({ body, params, query })` | `shared/validate.js:8` | Zod; substitui o valor original pelo valor limpo |
| `limitesLogin` | `shared/limites.js` | Rate limit do login |
| `rotaNaoEncontrada`, `errorHandler` | `shared/errors.js` | 404 e tratamento global de erros |
| `wrapAll(controller)` | `shared/http.js:15` | Encaminha erros de funções `async` ao `errorHandler` (Express 4) |

### Tratamento de erros
`errorHandler` ([shared/errors.js:26-54](backend/src/shared/errors.js#L26-L54)): `AppError` → status próprio; `ZodError` → 400 `VALIDACAO` com `details`;
corpo grande → 413; JSON inválido → 400; `ER_DUP_ENTRY` → 409; qualquer outro → 500 genérico (detalhe só no console).

### Integração com o banco
`mysql2/promise` com *pool* de 10 conexões ([config/db.js](backend/src/config/db.js)); `withTransaction(fn)` para operações multi-tabela
(criar chamado + histórico; alterar chamado + histórico; trocar status inicial). SQL sempre com `?`. Nomes de tabela/coluna dinâmicos em
`cadastros.repository` vêm de lista fixa (`cadastros.tipos.js`), nunca do usuário.

### Rotas
Prefixo `/api`. Autenticação: `A` = `autenticar` + `exigirSenhaTrocada`; `ADM` = também `exigirPerfil('admin')`.

| Método | Endpoint | Arquivo de rota | Controller | Proteção | Finalidade |
|---|---|---|---|---|---|
| GET | `/api/health` | `app.js:28` | inline | pública | Verificar se a API está no ar |
| POST | `/api/auth/login` | `auth.routes.js:25` | `login` | pública + rate limit | Entrar |
| POST | `/api/auth/refresh` | `auth.routes.js:26` | `renovar` | cookie | Renovar token (rotação) |
| POST | `/api/auth/logout` | `auth.routes.js:27` | `sair` | cookie | Encerrar sessão |
| GET | `/api/auth/me` | `auth.routes.js:28` | `eu` | `autenticar` | Dados do usuário logado |
| PATCH | `/api/auth/senha` | `auth.routes.js:29` | `trocarSenha` | `autenticar` | Trocar a própria senha |
| GET | `/api/chamados` | `chamados.routes.js:54` | `listar` | A | Lista paginada e filtrada |
| GET | `/api/chamados/:id` | `chamados.routes.js:55` | `buscarPorId` | A | Detalhe |
| GET | `/api/chamados/:id/historico` | `chamados.routes.js:56` | `historico` | A | Linha do tempo |
| POST | `/api/chamados` | `chamados.routes.js:57` | `criar` | A | Abrir chamado |
| PATCH | `/api/chamados/:id` | `chamados.routes.js:58` | `atualizar` | A (+ regras no service) | Editar / mudar status, prioridade, setor, responsável |
| POST | `/api/chamados/:id/assumir` | `chamados.routes.js:59` | `assumir` | A + ADM | Admin vira responsável |
| POST | `/api/chamados/:id/cancelar` | `chamados.routes.js:60` | `cancelar` | A (+ regras) | Cancelar |
| POST | `/api/chamados/:id/reabrir` | `chamados.routes.js:61` | `reabrir` | A (+ regras) | Reabrir com motivo |
| POST | `/api/chamados/:id/observacoes` | `chamados.routes.js:62` | `comentar` | A | Observação (interna só admin) |
| DELETE | `/api/chamados/:id` | `chamados.routes.js:63` | `excluir` | A + ADM | Excluir definitivamente |
| GET | `/api/cadastros/:tipo` | `cadastros.routes.js:50` | `listar` | A | Lista de categorias/prioridades/status/setores (`?ativos=1` opcional) |
| POST | `/api/cadastros/:tipo` | `cadastros.routes.js:56` | `criar` | A + ADM | Criar item |
| PATCH | `/api/cadastros/:tipo/:id` | `cadastros.routes.js:57` | `atualizar` | A + ADM | Editar / desativar / reativar |
| GET | `/api/dashboard` | `dashboard.routes.js:15` | `resumo` | A | Indicadores (variam por perfil) |
| GET | `/api/usuarios` | `usuarios.routes.js:27` | `listar` | A + ADM | Lista de usuários |
| GET | `/api/usuarios/:id` | `usuarios.routes.js:28` | `buscarPorId` | A + ADM | Um usuário |
| POST | `/api/usuarios` | `usuarios.routes.js:29` | `criar` | A + ADM | Criar (com senha temporária) |
| PATCH | `/api/usuarios/:id` | `usuarios.routes.js:30` | `atualizar` | A + ADM | Editar / ativar / desativar |
| POST | `/api/usuarios/:id/redefinir-senha` | `usuarios.routes.js:32` | `redefinirSenha` | A + ADM | Nova senha temporária + revoga sessões |

### Services (regras de negócio)
| Service | Principais funções |
|---|---|
| [auth.service.js](backend/src/modules/auth/auth.service.js) | `login`, `renovar`, `sair`, `eu`, `trocarSenha`, `limparSessoesAntigas` |
| [usuarios.service.js](backend/src/modules/usuarios/usuarios.service.js) | `listar`, `buscarPorId`, `criar`, `atualizar` (proteções do último admin), `redefinirSenha` |
| [chamados.service.js](backend/src/modules/chamados/chamados.service.js) | `listar`, `buscarPorId` (dono/admin), `criar`, `atualizar`, `assumir`, `cancelar`, `reabrir`, `comentar`, `listarHistorico`, `excluir`; auxiliares `diferencas`, `salvarComHistorico`, `dataEncerramento`, `garantirResponsavelValido` |
| [cadastros.service.js](backend/src/modules/cadastros/cadastros.service.js) | `listar`, `buscarPorId`, `criar`, `atualizar`, `garantirAtivo`, `statusInicialId`, `primeiroStatusDoTipo` |
| [dashboard.service.js](backend/src/modules/dashboard/dashboard.service.js) | `resumo` (7 consultas em paralelo com `Promise.all`) |

---

## 16. Banco de dados

**SGBD:** MySQL · **Banco:** `helpdesk` · **Engine:** InnoDB · **Charset:** utf8mb4.
**Fontes:** [database/schema_completo.sql](database/schema_completo.sql) (formato final) e [database/schema.sql](database/schema.sql) + [migrations/001–004](database/migrations/).
Segundo [database/README.md](database/README.md), as migrações 001–004 estão **executadas localmente** e **pendentes em produção**.

### Tabelas
| Tabela | Finalidade | PK | FKs | Principais campos |
|---|---|---|---|---|
| `setores` | Áreas da instituição | `id` | — | `nome` (único), `ativo` |
| `usuarios` | Pessoas com acesso | `id` | `setor_id → setores.id` | `nome`, `email` (único), `senha_hash` (bcrypt), `perfil` ENUM('usuario','admin'), `ativo`, `trocar_senha`, `ultimo_acesso`, `criado_em`, `atualizado_em` |
| `sessoes` | Refresh tokens (login) | `id` | `usuario_id → usuarios.id` **ON DELETE CASCADE** | `token_hash` CHAR(64) (único, SHA-256), `user_agent`, `criado_em`, `expira_em`, `revogado_em` |
| `categorias` | Tipo do problema | `id` | — | `nome` (único), `ativo` |
| `prioridades` | Urgência | `id` | — | `nome` (único), `nivel` (1 = mais baixa), `cor`, `ativo` |
| `status_chamados` | Etapas do atendimento | `id` | — | `nome` (único), `tipo` ENUM('aberto','andamento','resolvido','cancelado'), `inicial`, `cor`, `ordem`, `ativo` |
| `chamados` | Pedidos de suporte | `id` | `usuario_solicitante_id`, `usuario_responsavel_id` → `usuarios`; `setor_id` → `setores`; `categoria_id`, `prioridade_id`, `status_id` → cadastros | `titulo` (150), `descricao` TEXT, `data_abertura`, `data_atualizacao` (ON UPDATE), `data_encerramento` |
| `chamado_historico` | Linha do tempo (inclui **observações/comentários**) | `id` | `chamado_id → chamados.id` **ON DELETE CASCADE**; `usuario_id → usuarios.id` | `tipo` ENUM('abertura','edicao','status','prioridade','responsavel','observacao','reabertura'), `valor_anterior`, `valor_novo` (texto da época), `texto`, `interna`, `criado_em` |

- **Comentários:** não há tabela própria — **NÃO EXISTE NO PROJETO ATUAL** uma tabela `comentarios`; observações são linhas `tipo='observacao'` em `chamado_historico`.
- **Anexos:** **NÃO EXISTE NO PROJETO ATUAL**.
- **Índices:** `chamados` tem índices em solicitante, responsável, setor, categoria, prioridade, status e data de abertura; `chamado_historico(chamado_id, criado_em)`;
  `usuarios(setor_id)`; `sessoes(usuario_id)`.

### Relacionamentos (resumo textual)
```
SETORES        1 : N  USUARIOS                 (usuarios.setor_id, opcional)
SETORES        1 : N  CHAMADOS                 (chamados.setor_id, copiado do solicitante na abertura)
USUARIOS       1 : N  SESSOES                  (cascata ao apagar usuário)
USUARIOS       1 : N  CHAMADOS  (solicitante)  (chamados.usuario_solicitante_id, obrigatório)
USUARIOS       1 : N  CHAMADOS  (responsável)  (chamados.usuario_responsavel_id, opcional)
CATEGORIAS     1 : N  CHAMADOS
PRIORIDADES    1 : N  CHAMADOS
STATUS_CHAMADOS 1 : N CHAMADOS
CHAMADOS       1 : N  CHAMADO_HISTORICO        (cascata ao excluir chamado)
USUARIOS       1 : N  CHAMADO_HISTORICO        (autor de cada linha)
```

### Dados iniciais (scripts)
Categorias (Hardware, Software, Rede / Internet, Acesso / Senha, Outros); prioridades (Baixa 1, Média 2, Alta 3); status (Aberto — inicial,
Em atendimento, Resolvido, Cancelado); setores (Financeiro, Secretaria, Biblioteca, Laboratório, Coordenação, TI); primeiro administrador
`admin@helpdesk.local` com senha temporária documentada no script de migração 001.

---

## 17. Fluxos completos do sistema

### FLUXO A — Cadastro de usuário (feito pelo administrador)
```
Admin clica "Novo usuário"           → UsuariosPage (onClick → alterarParams({ novo: "1" }))
→ Modal + UsuarioForm                → onChange atualiza `valores`
→ onSubmit (enviar)                  → onSalvar(dados) → aoSalvar → salvar.mutate({ dados })
→ useSalvarUsuario                   → api("/usuarios", { method: "POST" })
→ POST /api/usuarios                 → autenticar → exigirSenhaTrocada → exigirPerfil(admin) → validate(criarSchema) → controller.criar
→ usuarios.service.criar             → e-mail livre? setor ativo? gera senha temporária + bcrypt
→ MySQL                              → INSERT INTO usuarios (... trocar_senha = TRUE)
→ 201 { data: { usuario, senha_temporaria }, message }
→ UI                                 → toast; fecha modal; abre modal SenhaTemporaria; invalida ["usuarios"]
```
Auto-cadastro público: **NÃO EXISTE NO PROJETO ATUAL.**

### FLUXO B — Login
```
Usuário digita e-mail/senha          → LoginPage (onChange → setValores)
→ onSubmit (enviar)                  → login.mutate(valores) → entrar()
→ api("/auth/login", POST)
→ POST /api/auth/login               → limiteLoginPorIp → limiteLoginPorConta → validate(loginSchema) → controller.login
→ auth.service.login                 → usuarios.buscarParaLogin → bcrypt.compare → ativo? → registrarAcesso → criarSessao
→ MySQL                              → SELECT usuarios; UPDATE ultimo_acesso; INSERT sessoes (token_hash)
→ 200 { data: { token, usuario } } + Set-Cookie helpdesk_sessao (httpOnly)
→ UI                                 → definirToken; setUsuario; navigate(origem ou "/")
                                       (se trocar_senha → RotaProtegida força /trocar-senha)
```

### FLUXO C — Abertura de chamado
```
Clica "Abrir chamado"                → ChamadosPage (onClick → ?novo=1) → ChamadoModal modo "novo"
→ ChamadoForm                        → selects carregados por useCadastro (GET /api/cadastros/:tipo)
→ onSubmit (enviar)                  → onSalvar({ titulo, descricao, categoria_id, prioridade_id }) → criar.mutate
→ useCriarChamado                    → api("/chamados", POST)
→ POST /api/chamados                 → autenticar → exigirSenhaTrocada → validate(criarSchema) → controller.criar
→ chamados.service.criar             → categoria/prioridade ativas; setor do solicitante; status inicial
→ MySQL (transação)                  → INSERT chamados; SELECT; INSERT chamado_historico (tipo "abertura")
→ 201 { data: chamado, message: "Chamado aberto com sucesso." }
→ UI                                 → toast; fecha modal; invalida ["chamados"] e ["dashboard"] → lista e cards recarregam
```

### FLUXO D — Listagem dos chamados do usuário
```
Abre /chamados (menu "Meus chamados") → ChamadosPage lê filtros da URL (useSearchParams)
→ useChamados({ ...filtros, pagina, por_pagina: 20 }) → api("/chamados?...")
→ GET /api/chamados                  → autenticar → exigirSenhaTrocada → validate(filtrosSchema) → controller.listar
→ chamados.service.listar            → usuário comum: força usuarioSolicitanteId = req.usuario.id
→ MySQL                              → SELECT ... JOINs ... WHERE ... ORDER BY c.id DESC LIMIT ? OFFSET ?; SELECT COUNT(*)
→ 200 { data: [...], meta: { total, pagina, por_pagina, paginas } }
→ UI                                 → LoadingState → tabela (desktop) / cartões (celular) / EmptyState; Paginacao
```

### FLUXO E — Visualização de chamado
```
Clica numa linha                     → Tr onClick → abrir(id) → ?chamado=ID → ChamadoModal modo "ver"
→ useChamado(id)                     → GET /api/chamados/:id → service.buscarPorId (dono ou admin; senão 404)
→ ChamadoHistorico → useHistorico(id) → GET /api/chamados/:id/historico → historico.listarPorChamado(incluirInternas = admin)
→ MySQL                              → SELECT chamado com JOINs; SELECT chamado_historico JOIN usuarios
→ UI                                 → ChamadoDetalhe + linha do tempo; botões conforme permissoesChamado()
```

### FLUXO F — Alteração de status (administrador)
```
Clica "Editar"                       → ChamadoModal (onEditar → ?editar=1) → ChamadoForm completo
→ onChange no select Status          → valores.status_id
→ onSubmit                           → atualizar.mutate({ id, dados: { ..., status_id } })
→ PATCH /api/chamados/:id            → validate(atualizarSchema) → controller.atualizar
→ chamados.service.atualizar         → status ativo? calcula data_encerramento pelo tipo
→ salvarComHistorico (transação)     → UPDATE chamados; SELECT depois; INSERT chamado_historico (tipo "status", anterior → novo)
→ 200 { data, message: "Chamado atualizado com sucesso." }
→ UI                                 → toast; volta ao modo ver; badge e histórico atualizados (invalidate ["chamados"])
```
Atalhos que também mudam status: **Assumir** (aberto → primeiro status do tipo "andamento"), **Cancelar** (→ primeiro status "cancelado"),
**Reabrir** (resolvido → status inicial).

### FLUXO G — Atribuição de responsável
```
Opção 1: "Assumir atendimento"       → ChamadoModal onClick → assumir.mutate(id)
         → POST /api/chamados/:id/assumir → exigirPerfil(admin) → service.assumir
         → responsável = admin logado; se aberto, status → "andamento"
         → transação: UPDATE chamados + INSERT historico ("responsavel" e "status")
         → toast "Você assumiu o chamado #ID"
Opção 2: Editar → select "Responsável" (admins ativos) → PATCH /api/chamados/:id { usuario_responsavel_id }
         → garantirResponsavelValido (admin ativo) → transação + histórico "responsavel"
```

### FLUXO H — Cadastro administrativo (ex.: nova categoria)
```
/cadastros?tipo=categorias → "Nova categoria" (onClick → ?novo=1) → Modal + CadastroForm
→ onSubmit → salvar.mutate({ dados: { nome, ativo } }) → useSalvarCadastro("categorias")
→ POST /api/cadastros/categorias     → exigirPerfil(admin) → validarCorpo("criar") (schema do tipo) → controller.criar
→ cadastros.service.criar            → (status: valida regras do inicial; se vira inicial, transação desmarca o anterior)
→ MySQL                              → INSERT INTO categorias (nome, ativo)  — nome repetido → 409
→ 201 { data, message: "Categoria cadastrada." }
→ UI                                 → toast; fecha modal; invalida ["cadastros","categorias"] e ["chamados"]
Desativar: botão "Desativar" → PATCH /api/cadastros/:tipo/:id { ativo: false } → "Categoria desativada."
```

### FLUXO I — Logout
```
Menu do usuário → "Sair"             → MenuUsuario onClick={sair}
→ sair()                             → api("/auth/logout", POST) (erros ignorados)
→ POST /api/auth/logout              → controller.sair → service.sair (revogarPorHash) → clearCookie
→ MySQL                              → UPDATE sessoes SET revogado_em = NOW()
→ 200 { message: "Você saiu do sistema." }
→ UI                                 → encerrar(): token = null; usuario = null; queryClient.clear()
                                       → RotaProtegida redireciona para /login
```

---

## 18. Principais trechos representativos do front-end

### JSX
1. **Conceito:** JSX com expressões · **Arquivo:** [frontend/src/components/ui/StatCard.jsx](frontend/src/components/ui/StatCard.jsx) · **Componente:** `StatCard`
```jsx
<div className="mt-3 text-3xl font-semibold tabular-nums">
  {carregando ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-superficie-2" /> : valor}
</div>
```
5. **Faz:** mostra um "esqueleto" pulsando enquanto carrega, depois o número. 6. **Muda:** o card troca do bloco cinza para o valor real.

### Componentes
1. **Conceito:** componente reutilizável com variantes · **Arquivo:** [frontend/src/components/ui/Button.jsx](frontend/src/components/ui/Button.jsx) · `Button`
```jsx
export function Button({ variante = "primaria", tamanho = "md", carregando = false, className, children, disabled, ...props }) {
  return (
    <button type="button" disabled={disabled || carregando} className={classesBotao({ variante, tamanho, className })} {...props}>
```
5. **Faz:** um botão para todo o sistema, com 5 variantes e 3 tamanhos. 6. **Muda:** aparência conforme `variante`; desabilita durante o carregamento.

### Props
1. **Conceito:** callbacks como Props · **Arquivo:** [ChamadoModal.jsx:94](frontend/src/features/chamados/components/ChamadoModal.jsx#L94) · `ChamadoModal` → `ChamadoForm`
```jsx
<ChamadoForm formId={FORM_ID} erro={criar.error} onSalvar={(dados) => criar.mutate(dados, { onSuccess: aoSucesso(onFechar) })} />
```
5. **Faz:** o filho devolve os dados; o pai grava. 6. **Muda:** ao salvar, aparece toast e o modal fecha.

### State
1. **Conceito:** estado de formulário com atualização imutável · **Arquivo:** [LoginPage.jsx:16-23](frontend/src/features/auth/LoginPage.jsx#L16-L23) · `LoginPage`
```jsx
const [valores, setValores] = useState({ email: "", senha: "" });
const alterar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));
```
5. **Faz:** um único objeto guarda todos os campos; `alterar("email")` cria o handler de cada campo. 6. **Muda:** o input mostra o que foi digitado.

### Hooks
1. **Conceito:** hook de dados com cache · **Arquivo:** [frontend/src/features/chamados/api.js:10-17](frontend/src/features/chamados/api.js#L10-L17) · `useChamados`
```js
return useQuery({
  queryKey: ["chamados", "lista", Object.fromEntries(params)],
  queryFn: () => api(`/chamados?${params}`),
  placeholderData: keepPreviousData
});
```
5. **Faz:** cada combinação de filtros tem seu cache; a lista anterior fica visível enquanto a nova chega. 6. **Muda:** troca de filtro sem "piscar" (lista esmaecida).

### Eventos
1. **Conceito:** fechar ao clicar fora (efeito + listener) · **Arquivo:** [AppLayout.jsx:33-38](frontend/src/layouts/AppLayout.jsx#L33-L38) · `MenuUsuario`
```jsx
useEffect(() => {
  if (!aberto) return;
  const aoClicar = (e) => !ref.current?.contains(e.target) && setAberto(false);
  document.addEventListener("mousedown", aoClicar);
  return () => document.removeEventListener("mousedown", aoClicar);
}, [aberto]);
```
5. **Faz:** registra o listener só com o menu aberto e remove depois. 6. **Muda:** o dropdown fecha ao clicar em qualquer lugar fora dele.

### Formulários
1. **Conceito:** erros do servidor por campo · **Arquivo:** [ChamadoForm.jsx:39-40](frontend/src/features/chamados/components/ChamadoForm.jsx#L39-L40) · `ChamadoForm`
```jsx
const errosCampo = Object.fromEntries((erro?.details ?? []).map((d) => [d.campo, d.mensagem]));
const erroGeral = erro && !erro.details ? erro.message : null;
```
5. **Faz:** transforma `[{ campo, mensagem }]` em `{ titulo: "Informe o título." }`. 6. **Muda:** a mensagem aparece em vermelho embaixo do campo certo.

### Renderização condicional
1. **Conceito:** cadeia de estados de carregamento · **Arquivo:** [ChamadosPage.jsx:155-171](frontend/src/features/chamados/ChamadosPage.jsx#L155-L171) · `ChamadosPage`
```jsx
{chamados.isPending ? (
  <Card><LoadingState texto="Carregando chamados..." /></Card>
) : chamados.isError ? (
  <Alert tom="perigo" titulo="Não foi possível carregar os chamados." acao={<Button ... onClick={() => chamados.refetch()}>Tentar de novo</Button>}>
```
5. **Faz:** escolhe entre carregando, erro (com "Tentar de novo") e lista. 6. **Muda:** a área principal da página.

### Listas
1. **Conceito:** lista derivada + agrupamento · **Arquivo:** [AppLayout.jsx:102-127](frontend/src/layouts/AppLayout.jsx#L102-L127) · `Navegacao`
```jsx
const itens = MENU.filter((item) => !item.perfis || item.perfis.includes(usuario.perfil));
const secoes = [...new Set(itens.map((i) => i.secao))];
```
5. **Faz:** filtra o menu pelo perfil e agrupa por seção. 6. **Muda:** usuário comum vê 2 itens; admin vê 4 em 2 seções.

### Tailwind
1. **Conceito:** variantes por objeto + `cn()` · **Arquivo:** [Badge.jsx:3-10](frontend/src/components/ui/Badge.jsx#L3-L10) · `Badge`
```js
const tons = {
  neutro: "bg-superficie-2 text-texto-suave",
  sucesso: "bg-sucesso-suave text-sucesso",
  perigo: "bg-perigo-suave text-perigo"
  // ...
};
```
5. **Faz:** mapeia o nome da cor salvo no banco (`status.cor`) para classes. 6. **Muda:** cor do badge; funciona no claro e no escuro.

### Navegação
1. **Conceito:** estado na URL · **Arquivo:** [ChamadosPage.jsx:80-83](frontend/src/features/chamados/ChamadosPage.jsx#L80-L83) · `ChamadosPage`
```jsx
const idAberto = params.get("chamado");
const modo = params.get("novo") === "1" ? "novo" : idAberto ? (params.get("editar") === "1" ? "editar" : "ver") : null;
```
5. **Faz:** o modal aberto é deduzido da URL. 6. **Muda:** o link `/chamados?chamado=17` abre direto o chamado 17 (usado pelos "recentes" do Início).

### Autenticação
1. **Conceito:** guarda de rota · **Arquivo:** [RotasProtegidas.jsx:18-26](frontend/src/features/auth/RotasProtegidas.jsx#L18-L26) · `RotaProtegida`
```jsx
if (carregando) return <TelaCarregando />;
if (!usuario) return <Navigate to="/login" replace state={{ de: local }} />;
if (usuario.trocar_senha && local.pathname !== "/trocar-senha") return <Navigate to="/trocar-senha" replace />;
return <Outlet />;
```
5. **Faz:** decide se a pessoa entra, vai ao login ou é obrigada a trocar a senha. 6. **Muda:** redirecionamento automático.

### API
1. **Conceito:** renovação transparente do token · **Arquivo:** [lib/api.js:77-91](frontend/src/lib/api.js#L77-L91) · `api`
```js
if (erro.status !== 401 || caminho.startsWith("/auth/")) throw erro;
try { await renovarSessao(); } catch { tokenAcesso = null; aoExpirarSessao(); throw erro; }
return requisitar(caminho, opcoes);
```
5. **Faz:** token vencido → renova pelo cookie e repete. 6. **Muda:** a pessoa não percebe a expiração de 15 min; se a sessão acabou, volta ao login.

### Loading
1. **Conceito:** botão em carregamento · **Arquivo:** [Button.jsx:38](frontend/src/components/ui/Button.jsx#L38)
```jsx
{carregando && <Loader2 className="size-4 animate-spin" aria-hidden />}
```
5. **Faz:** ícone girando + botão desabilitado. 6. **Muda:** impede clique duplo enquanto grava.

### Erro
1. **Conceito:** classe de erro da API · **Arquivo:** [lib/api.js:4-11, 49-51](frontend/src/lib/api.js#L4-L11)
```js
if (!resposta.ok) {
  throw new ApiError(corpo.error?.message || `Erro ${resposta.status} na API.`, resposta.status, corpo.error ?? {});
}
```
5. **Faz:** padroniza erros (mensagem, status, `code`, `details`). 6. **Muda:** telas mostram a mensagem em português vinda do servidor.

### Feedback visual
1. **Conceito:** toast global por Context · **Arquivo:** [Toast.jsx:21-28](frontend/src/components/ui/Toast.jsx#L21-L28) · `ToastProvider`
```jsx
const mostrar = useCallback((tipo, mensagem) => {
  const id = proximoId++;
  setAvisos((lista) => [...lista, { id, tipo, mensagem }]);
  setTimeout(() => remover(id), 4000);
}, [remover]);
```
5. **Faz:** adiciona um aviso e remove após 4 s. 6. **Muda:** aparece "Chamado aberto com sucesso." no canto superior.

---

## 19. Principais trechos representativos do back-end

### Autenticação (verificação do token)
**Arquivo:** [backend/src/shared/auth.js:20-33](backend/src/shared/auth.js#L20-L33) · **Função:** `autenticar` · **Finalidade:** exigir JWT válido.
```js
const [tipo, token] = (req.headers.authorization || "").split(" ");
if (tipo !== "Bearer" || !token) return next(unauthorized());
const dados = jwt.verify(token, env.auth.jwtSecret, { algorithms: ["HS256"] });
req.usuario = { id: Number(dados.sub), nome: dados.nome, perfil: dados.perfil, trocar_senha: dados.trocar_senha };
```

### Criação de usuário
**Arquivo:** [usuarios.service.js:44-54](backend/src/modules/usuarios/usuarios.service.js#L44-L54) · **Função:** `criar` · **Finalidade:** criar com senha temporária.
```js
const senhaTemporaria = senhas.gerarSenhaTemporaria();
const id = await repository.inserir({ ...dados, senha_hash: await senhas.gerarHash(senhaTemporaria) });
return { data: { usuario: await buscarPorId(id), senha_temporaria: senhaTemporaria }, message: "..." };
```

### Login
**Arquivo:** [auth.service.js:40-49](backend/src/modules/auth/auth.service.js#L40-L49) · **Função:** `login` · **Finalidade:** conferir credenciais sem revelar quais e-mails existem.
```js
const usuario = await usuarios.buscarParaLogin(email);
const senhaConfere = await senhas.conferir(senha, usuario?.senha_hash ?? senhas.HASH_FALSO);
if (!usuario || !senhaConfere) throw unauthorized("E-mail ou senha incorretos.");
if (!usuario.ativo) throw forbidden("Usuário desativado. Procure o administrador.");
```

### Proteção de rota
**Arquivo:** [backend/src/app.js:31-35](backend/src/app.js#L31-L35) · **Finalidade:** encadear middlewares por grupo de rotas.
```js
app.use("/api/auth", authRoutes);
app.use("/api/chamados", autenticar, exigirSenhaTrocada, chamadosRoutes);
app.use("/api/usuarios", autenticar, exigirSenhaTrocada, exigirPerfil(PERFIS.ADMIN), usuariosRoutes);
```

### Criação de chamado
**Arquivo:** [chamados.service.js:108-123](backend/src/modules/chamados/chamados.service.js#L108-L123) · **Função:** `criar` · **Finalidade:** chamado + histórico na mesma transação.
```js
const chamado = await withTransaction(async (conn) => {
  const id = await repository.inserir({ ...dados, usuario_solicitante_id: usuario.id, setor_id: solicitante?.setor_id, status_id }, conn);
  const criado = await repository.buscarPorId(id, conn);
  await historico.inserir({ chamado_id: id, usuario_id: usuario.id, tipo: "abertura", valor_novo: criado.status }, conn);
  return criado;
});
```

### Listagem (visibilidade por perfil)
**Arquivo:** [chamados.service.js:41-48](backend/src/modules/chamados/chamados.service.js#L41-L48) · **Função:** `listar`
```js
if (f.responsavel === "eu") f.responsavel = usuario.id;
if (!ehAdmin(usuario)) f.usuarioSolicitanteId = usuario.id;
```

### Atualização (regras do solicitante)
**Arquivo:** [chamados.service.js:128-134](backend/src/modules/chamados/chamados.service.js#L128-L134) · **Função:** `atualizar`
```js
if (!ehAdmin(usuario)) {
  if (existente.status_tipo !== TIPO.ABERTO) throw forbidden("Este chamado já está em atendimento. ...");
  const proibidos = Object.keys(dados).filter((campo) => dados[campo] !== undefined && !CAMPOS_DO_SOLICITANTE.includes(campo));
  if (proibidos.length > 0) throw forbidden("Status, setor e responsável só podem ser alterados pela equipe de suporte.");
}
```

### Exclusão
**Arquivo:** [chamados.repository.js:133-136](backend/src/modules/chamados/chamados.repository.js#L133-L136) + rota `router.delete("/:id", somenteAdmin, ...)`
```js
const [resultado] = await pool.query("DELETE FROM chamados WHERE id = ?", [id]);
return resultado.affectedRows > 0;
```
(o histórico é apagado pela FK `ON DELETE CASCADE`).

### Gestão administrativa (proteção do último admin)
**Arquivo:** [usuarios.service.js:66-72](backend/src/modules/usuarios/usuarios.service.js#L66-L72) · **Função:** `atualizar`
```js
if (eleMesmo && novo.perfil !== PERFIS.ADMIN) throw badRequest("Você não pode tirar o seu próprio perfil de administrador.");
const deixaDeSerAdminAtivo = existente.perfil === PERFIS.ADMIN && existente.ativo && (novo.perfil !== PERFIS.ADMIN || !novo.ativo);
if (deixaDeSerAdminAtivo && (await repository.contarAdminsAtivos()) <= 1) throw badRequest("Este é o último administrador ativo. ...");
```

### Acesso ao banco (filtro parametrizado)
**Arquivo:** [chamados.repository.js:53-90](backend/src/modules/chamados/chamados.repository.js#L53-L90) · **Função:** `montarFiltro`
```js
const igual = (coluna, valor) => {
  if (valor !== undefined && valor !== null && valor !== "") { condicoes.push(`${coluna} = ?`); params.push(valor); }
};
igual("c.status_id", f.status_id);
if (f.situacao === "ativos") condicoes.push("s.tipo IN ('aberto', 'andamento')");
```
(reaproveitado pelo dashboard, para que o número do card seja igual ao da lista filtrada).

### Transação
**Arquivo:** [backend/src/config/db.js:19-32](backend/src/config/db.js#L19-L32) · **Função:** `withTransaction`
```js
await conn.beginTransaction();
const resultado = await fn(conn);
await conn.commit();
// catch → conn.rollback(); finally → conn.release()
```

### Tratamento de erro
**Arquivo:** [backend/src/shared/errors.js:26-34](backend/src/shared/errors.js#L26-L34) · **Função:** `errorHandler`
```js
if (err instanceof AppError) return res.status(err.status).json({ error: { message: err.message, code: err.code, details: err.details } });
if (err instanceof ZodError) {
  const details = err.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message }));
  return res.status(400).json({ error: { message: details[0].mensagem, code: "VALIDACAO", details } });
}
```

---

## 20. Dependências

### FRONT-END ([frontend/package.json](frontend/package.json))
| Dependência | Finalidade | Onde é usada |
|---|---|---|
| `react` 18 / `react-dom` 18 | Biblioteca de UI / renderização no DOM, `createPortal` | Todo o `src/`; `main.jsx`; `Modal.jsx` |
| `react-router-dom` 6 | Rotas, links, redirecionamento, query string | `main.jsx`, `routes.jsx`, `AppLayout`, `RotasProtegidas`, páginas |
| `@tanstack/react-query` 5 | Busca, cache, mutações e invalidação de dados do servidor | `main.jsx`, `features/*/api.js`, `AuthContext`, `LoginPage`, `TrocarSenhaPage` |
| `lucide-react` | Ícones SVG | Praticamente todos os componentes |
| `clsx` | Montar `className` condicional | `lib/cn.js` |
| `tailwind-merge` | Resolver conflito entre classes Tailwind | `lib/cn.js` |
| `vite` 6 *(dev)* | Servidor de desenvolvimento e build | `vite.config.js`, scripts |
| `@vitejs/plugin-react` *(dev)* | JSX/Fast Refresh no Vite | `vite.config.js` |
| `tailwindcss` 4 + `@tailwindcss/vite` *(dev)* | CSS utilitário | `vite.config.js`, `index.css` |

### BACK-END ([backend/package.json](backend/package.json))
| Dependência | Finalidade | Onde é usada |
|---|---|---|
| `express` 4 | Servidor HTTP e rotas | `app.js`, `*.routes.js` |
| `mysql2` | Conexão MySQL (promise + pool) | `config/db.js`, repositories |
| `zod` | Validação de body/params/query | `shared/validate.js`, `*.routes.js`, `shared/errors.js` |
| `jsonwebtoken` | JWT de acesso | `shared/auth.js` |
| `bcryptjs` | Hash de senha | `shared/senhas.js` |
| `cookie-parser` | Ler o cookie do refresh token | `app.js`, `auth.controller.js` |
| `cors` | Permitir o front (com credenciais) | `app.js` |
| `helmet` | Cabeçalhos de segurança | `app.js` |
| `express-rate-limit` | Limite de tentativas de login | `shared/limites.js` |
| `dotenv` | Carregar `backend/.env` | `config/env.js` |
| `nodemon` *(dev)* | Reiniciar ao salvar | script `npm run dev` |

`crypto` (refresh token, SHA-256, senha temporária) é módulo nativo do Node.

---

## 21. Estado atual do sistema

### Funcionalidades implementadas
- Login/logout com JWT + refresh token rotativo em cookie httpOnly; sessão recuperada ao recarregar; renovação automática.
- Senha temporária com troca obrigatória; troca voluntária; redefinição pelo admin (revoga sessões).
- Rate limit do login; mensagens que não revelam e-mails cadastrados.
- Perfis `usuario`/`admin` conferidos no servidor e refletidos na tela.
- Chamados: listar (busca, 8 filtros, paginação no servidor), abrir, ver, editar, assumir, cancelar, reabrir (7 dias), excluir (admin),
  observações públicas/internas, histórico automático em transação.
- Dashboard calculado no servidor (total, por tipo de status, alta prioridade, por categoria, recentes, fila do admin), com cards que abrem a lista filtrada.
- Cadastros auxiliares (4 tipos) com desativação em vez de exclusão; status com tipo/inicial/cor/ordem; prioridade com nível/cor.
- Gestão de usuários com proteções (último admin, si mesmo).
- Tema claro/escuro; layout responsivo (tabela no desktop, cartões no celular).
- Segundo [docs/roadmap.md](docs/roadmap.md): etapas 1 a 4.6 **validadas**; 5.1 (pré-deploy) **concluída, aguardando validação**; 5.2 (deploy) **dispensada**.
  Todos os itens de [docs/backlog.md](docs/backlog.md) estão marcados como resolvidos.

### Parcialmente implementadas / limitações observadas no código
- **Filtros de usuários** são feitos no navegador (lista completa carregada de uma vez, sem paginação), enquanto os de chamados são no servidor.
- **Edição do próprio perfil (nome/e-mail) pelo usuário comum:** não há tela nem rota — só o admin edita usuários. Usuário comum só troca a senha.
- **Fonte "Inter"** é citada em `--font-sans` ([index.css:76](frontend/src/index.css#L76)), mas não há importação da fonte; usa a do sistema se não instalada.
- **Cabeçalhos das migrações** dentro de `schema.sql` ainda dizem `Status: Proposta`, enquanto [database/README.md](database/README.md) registra as quatro como executadas localmente.

### Mencionadas como futuras (não iniciadas)
Linha 💭 do roadmap: conversa/comentários dedicados, **anexos**, **e-mail de notificação**, **SLA por prioridade**, **PWA**, **relatórios**.
Todos: **NÃO EXISTEM NO PROJETO ATUAL**. Também não existem: auto-cadastro, recuperação de senha por e-mail, testes automatizados.

### Telas existentes
`/login` (LoginPage) · `/trocar-senha` (TrocarSenhaPage) · `/` (InicioPage) · `/chamados` (ChamadosPage + modal novo/ver/editar) ·
`/cadastros` (CadastrosPage, admin) · `/usuarios` (UsuariosPage, admin) · `*` (NaoEncontrada).

### Telas incompletas
Nenhuma tela com código pela metade foi encontrada (sem `TODO`, componentes vazios ou rotas apontando para placeholders).

### Rotas do back-end não utilizadas pelo front-end
| Rota | Situação |
|---|---|
| `GET /api/health` | Não chamada pelo front (útil para monitoramento/teste manual) |
| `GET /api/auth/me` | Não chamada; o front obtém o usuário pelo `/auth/refresh` e pelo login |
| `GET /api/usuarios/:id` | Não chamada; a tela usa a lista completa e procura o item por id |
| `GET /api/cadastros/:tipo?ativos=1` | O parâmetro `ativos` existe, mas o front sempre busca todos e filtra com `opcoesAtivas()` |

### Componentes aparentemente não utilizados
Nenhum. Todos os arquivos de `components/ui/`, `layouts/` e `features/` são importados por alguma tela.
`Input`, `Select`, `Textarea` e `Checkbox` não têm arquivo próprio: ficam junto com `Field`, em `Field.jsx`.

### Pontos que dependem de configuração externa
- **MySQL** acessível com o banco `helpdesk` criado (via `schema_completo.sql` ou `schema.sql` + migrações) — sem isso, `server.js` encerra.
- **`backend/.env`** (modelo em [backend/.env.example](backend/.env.example)): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`,
  **`JWT_SECRET` (≥ 32 caracteres, obrigatório — sem ele a API não sobe)**, `JWT_EXPIRA_EM`, `SESSAO_DIAS`, `FRONTEND_URL` (CORS), `NODE_ENV`, `TRUST_PROXY`.
- **`frontend/.env.local`** opcional: `VITE_API_URL` (padrão `http://localhost:3000/api`).
- `FRONTEND_URL` precisa bater exatamente com a origem do front, senão o CORS com cookie falha.
- Em produção: HTTPS (cookie `secure`) e usuário de banco próprio (script comentado na parte 5 de `schema_completo.sql`).

---

## 22. Resumo técnico final

| Área | Arquivo | Componente / função | Responsabilidade | Integração com | Complexidade |
|---|---|---|---|---|---|
| Estrutura React | `frontend/src/main.jsx` | `createRoot` + providers | Montar a app com Query, Router, Toast, Auth | Todos os módulos | Básico |
| Rotas | `frontend/src/routes.jsx` | `AppRoutes` | Mapa de rotas aninhadas | `RotaProtegida`, `RotaAdmin`, `AppLayout` | Intermediário |
| Rotas | `features/auth/RotasProtegidas.jsx` | `RotaProtegida`, `RotaAdmin` | Guardas de acesso e redirecionamentos | `useAuth`, React Router | Intermediário |
| Componentes | `components/ui/Button.jsx` | `Button`, `classesBotao` | Botão padrão com variantes e loading | Todas as telas | Básico |
| Componentes | `components/ui/Modal.jsx` | `Modal` | Janela com portal, Esc e trava de rolagem | Chamados, cadastros, usuários | Intermediário |
| Componentes | `components/ui/Field.jsx` | `Field`, `Input`, `Select`, `Textarea`, `Checkbox` | Campos com rótulo, erro e acessibilidade | Todos os formulários | Intermediário |
| Componentes | `layouts/AppLayout.jsx` | `AppLayout`, `Navegacao`, `MenuUsuario` | Moldura logada e menu por perfil | `useAuth`, `useTema`, `Outlet` | Intermediário |
| Props | `features/chamados/components/ChamadoModal.jsx` | `ChamadoModal` → `ChamadoForm`/`ChamadoHistorico` | Passa dados, permissões e callbacks | `ChamadosPage`, hooks de chamados | Avançado |
| State | `features/chamados/ChamadosPage.jsx` | `textoBusca` + estado na URL | Filtros, página e modal na query string | `useSearchParams`, `useChamados` | Avançado |
| State | `features/auth/AuthContext.jsx` | `AuthProvider`, `useAuth` | Usuário logado global | `lib/api.js`, Query client | Avançado |
| Hooks | `features/*/api.js` | `useChamados`, `useCadastro`, `useUsuarios`... | Dados do servidor com cache e invalidação | `lib/api.js`, TanStack Query | Intermediário |
| Hooks | `components/ui/Toast.jsx` | `ToastProvider`, `useToast` | Avisos globais (Context + `useCallback`/`useMemo`) | Todas as telas | Intermediário |
| Tailwind | `frontend/src/index.css` | tema `@theme inline` + `.dark` | Cores por variável CSS, modo escuro sem `dark:` | Todos os componentes, `lib/tema.js` | Intermediário |
| Tailwind | `frontend/src/lib/cn.js` | `cn()` | Combinar classes sem conflito | `clsx`, `tailwind-merge` | Básico |
| Formulários | `features/chamados/components/ChamadoForm.jsx` | `ChamadoForm` | Abrir/editar chamado; campos de admin | `ChamadoModal`, `useCadastro`, `useUsuarios` | Intermediário |
| Formulários | `features/auth/LoginPage.jsx` | `LoginPage` | Login com erros por campo | `AuthContext`, `useMutation` | Básico |
| Autenticação | `frontend/src/lib/api.js` | `api`, `renovarSessao`, `definirToken` | Token em memória, refresh automático, erros | `AuthContext`, todos os hooks | Avançado |
| Autenticação | `backend/src/shared/auth.js` | `autenticar`, `exigirPerfil`, `exigirSenhaTrocada` | Verificar JWT e perfis | `app.js`, rotas | Intermediário |
| Autenticação | `backend/src/modules/auth/auth.service.js` | `login`, `renovar`, `sair`, `trocarSenha` | Sessão com refresh token rotativo | `sessoes`, `usuarios`, bcrypt, JWT | Avançado |
| API | `backend/src/app.js` | montagem de rotas | Middlewares globais e prefixos `/api` | Todos os módulos | Básico |
| Back-end | `backend/src/modules/chamados/chamados.service.js` | `criar`, `atualizar`, `assumir`, `cancelar`, `reabrir`, `salvarComHistorico` | Regras de negócio e histórico | repositories, cadastros, usuários, `withTransaction` | Avançado |
| Back-end | `backend/src/shared/errors.js` | `AppError`, `errorHandler` | Formato único de erro | Todos os módulos, Zod | Intermediário |
| Back-end | `backend/src/shared/validate.js` | `validate` | Validação Zod de body/params/query | Rotas | Básico |
| Back-end | `backend/src/modules/cadastros/cadastros.service.js` | `criar`, `atualizar`, `garantirAtivo`, `statusInicialId` | Cadastros genéricos por tipo + regra do status inicial | `cadastros.tipos.js`, chamados, usuários | Intermediário |
| Banco de dados | `backend/src/config/db.js` | `pool`, `withTransaction` | Conexões e transações | Todos os repositories | Intermediário |
| Banco de dados | `backend/src/modules/chamados/chamados.repository.js` | `montarFiltro`, `listar` | SQL com JOINs, filtros e paginação | Service de chamados, dashboard | Intermediário |
| Banco de dados | `database/schema_completo.sql` | 8 tabelas | Estrutura final do MySQL | Back-end | Intermediário |
