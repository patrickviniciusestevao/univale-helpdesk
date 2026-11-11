# SPEC — Univale Helpdesk

> **Índice** do que estamos construindo. Cada assunto tem o seu documento (abaixo); atualize o documento do assunto,
> não este, salvo mudança de visão, princípio ou arquitetura.
> Como trabalhar (regras, convenções e automações para pessoas e agentes de IA): [HARNESS.md](../HARNESS.md). Histórico: [relatorios/](relatorios/README.md).

## Documentos

| Documento | Conteúdo |
|---|---|
| [../HARNESS.md](../HARNESS.md) | **Como trabalhar:** regras, convenções, fluxo de etapa e automações (hooks e skills em `.claude/`) |
| [roadmap.md](roadmap.md) | Fases e etapas, com status e relatório |
| [decisoes.md](decisoes.md) | Decisões registradas (data, decisão, relatório) |
| [backlog.md](backlog.md) | Problemas e melhorias conhecidos (B-NN) |
| [seguranca.md](seguranca.md) | Itens obrigatórios antes do deploy |
| [modulos/usuarios-e-acesso.md](modulos/usuarios-e-acesso.md) | Login, sessão, perfis (usuário comum × administrador), cadastro de usuários |
| [modulos/chamados.md](modulos/chamados.md) | Abertura, acompanhamento, atendimento, responsável e histórico do chamado |
| [modulos/cadastros.md](modulos/cadastros.md) | Cadastros auxiliares: categorias, prioridades, status e setores |
| [modulos/dashboard.md](modulos/dashboard.md) | Painel com indicadores e chamados recentes |
| [legado/](legado/) | Material original da aula (não editar; fonte para consulta) |
| [../database/README.md](../database/README.md) | Migrações do banco (uma por arquivo) e status por ambiente |

## 1. Contexto
- **Hoje:** um helpdesk didático usado para ensinar frontend com HTML, CSS e JavaScript puro. Uma API Node/Express + MySQL faz o CRUD
  de chamados; qualquer pessoa vê, cria, edita e exclui qualquer chamado. Não há login, usuários, responsável pelo atendimento nem histórico.
  O solicitante é só um texto digitado.
- **O problema que a evolução resolve:** transformar o exemplo de aula num sistema de helpdesk de verdade, com dois lados —
  quem **pede** suporte (usuário comum) e quem **atende** (administrador) — e servir de material para ensinar React, Tailwind,
  autenticação (JWT, bcrypt) e organização de API.
- **Relação com outros sistemas:** nenhuma integração externa.
- **Visão futura:** comentários/conversa no chamado, anexos, notificação por e-mail, SLA por prioridade, relatórios — cada um como etapa própria.

## 2. Princípios
1. **Dois papéis claros.** Usuário comum vê e abre **os seus** chamados; administrador vê e gerencia **tudo**.
2. **Quem abriu e quem atende ficam registrados.** Todo chamado tem solicitante (usuário logado) e pode ter responsável (um administrador).
3. **Nada some sem rastro.** Mudanças de status, prioridade e responsável e as observações viram **histórico** do chamado;
   cadastros e usuários são **desativados**, não apagados.
4. **Permissão no servidor.** A API confere o perfil em cada requisição; a tela só esconde o que o usuário não pode usar.
5. **Banco sob controle do dono.** Mudanças de schema são propostas como migrações e executadas por ele.
6. **Código didático.** Simples, legível, com padrões repetidos; cada conceito novo aparece em um lugar só.
7. **Mobile-first e visual moderno**, com componentes próprios em Tailwind.

## 3. Módulos

| Módulo | Situação | Documento |
|---|---|---|
| Chamados | Com dono, setor, responsável, histórico, observações internas e reabertura (4.2, 4.5) | [chamados.md](modulos/chamados.md) |
| Cadastros auxiliares | Tela de manutenção (admin) para categorias, prioridades, status e setores; status com tipo/inicial/cor/ordem (4.3) | [cadastros.md](modulos/cadastros.md) |
| Usuários e acesso | Login, sessão e troca de senha (4.1); gestão de usuários pelo admin (4.4) | [usuarios-e-acesso.md](modulos/usuarios-e-acesso.md) |
| Dashboard | Indicadores no servidor, fila do admin, por categoria e recentes (4.6) | [dashboard.md](modulos/dashboard.md) |

## 4. Arquitetura

### 4.1 Stack e bibliotecas

| Camada | Escolha | Motivo |
|---|---|---|
| Backend | Node.js + Express 4 (CommonJS) | Já existente; simples para aula |
| Banco | MySQL (driver `mysql2/promise`, SQL puro) | Já existente; sem ORM para os alunos verem o SQL |
| Validação | Zod 3 | Validação declarativa nas rotas |
| Autenticação | `bcryptjs` + `jsonwebtoken` + `cookie-parser` | Pedido do dono: login com sessão, criptografia, JWT, bcrypt |
| Frontend | React 18 + Vite 6 | Pedido do dono |
| Estilo | Tailwind CSS 4, componentes próprios, ícones `lucide-react` | Decisão do dono (2026-11-11) |
| Dados no front | TanStack Query 5 + React Router 6 | Cache e estados de carregamento sem `useEffect` manual |

### 4.2 Estrutura (alvo)
```
backend/src/
  server.js            app Express, middlewares globais, rotas em /api
  config/              db.js (pool + withTransaction), env.js
  shared/              errors, http (ok/created), validate, auth (autenticar, exigirPerfil)
  modules/
    auth/              login, refresh, logout, /me
    usuarios/          CRUD de usuários (admin)
    chamados/          chamados + histórico
    cadastros/         categorias, prioridades, status, setores
    dashboard/         indicadores
frontend/src/
  components/ui/       componentes base (Button, Card, Modal, Table, Badge…)
  layouts/             AuthLayout, AppLayout (sidebar + topo)
  features/            chamados, cadastros, dashboard (+ auth, usuarios na 4.x)
  lib/                 api.js (cliente HTTP; token na 4.1), cn.js, format.js, tema.js
  routes.jsx           rotas (+ RotaProtegida, RotaAdmin na 4.1)
```

Convenções detalhadas em [HARNESS.md](../HARNESS.md#convenções-de-código).

## 5. Glossário
| Termo (como o dono fala) | Significado | No código |
|---|---|---|
| Chamado | Pedido de suporte aberto por um usuário | `chamados` |
| Solicitante | Usuário que abriu o chamado (João abriu) | `chamados.usuario_solicitante_id` |
| Responsável | Administrador que atende o chamado (Patrick está atendendo) | `chamados.usuario_responsavel_id` |
| Usuário comum | Perfil que abre e acompanha os próprios chamados | `usuarios.perfil = 'usuario'` |
| Administrador | Perfil que gerencia chamados, cadastros e usuários | `usuarios.perfil = 'admin'` |
| Setor | Área da instituição do usuário/chamado (Financeiro, Secretaria, Biblioteca, Laboratório, Coordenação, TI) | `setores`, `usuarios.setor_id`, `chamados.setor_id` |
| Categoria | Tipo do problema (Hardware, Software, Rede…) | `categorias` |
| Prioridade | Urgência (Baixa, Média, Alta) | `prioridades` |
| Status | Situação do chamado (Aberto, Em atendimento, Resolvido, Cancelado) | `status_chamados` |
| Histórico | Linha do tempo das mudanças e observações do chamado | `chamado_historico` |
| Observação | Mensagem no chamado (da equipe ou do solicitante); "interna" = só a equipe vê | `chamado_historico` (tipo observacao, interna) |
| Cadastros auxiliares | Categorias, prioridades, status e setores | módulo `cadastros` |
