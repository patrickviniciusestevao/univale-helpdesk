# Frontend — Univale Helpdesk

React 18 + Vite 6 + Tailwind CSS 4, com componentes próprios. Convenções em [../HARNESS.md](../HARNESS.md#convenções-de-código).

## Rodar
```bash
npm install
npm run dev      # http://localhost:5173  (a API precisa estar rodando em http://localhost:3000)
npm run build    # gera dist/
```
Outra URL de API: crie `.env.local` com `VITE_API_URL=http://servidor:3000/api` (modelo em `.env.example`).

## Estrutura
```
src/
  main.jsx              providers: TanStack Query, Router, Toast
  routes.jsx            rotas (dentro do AppLayout)
  index.css             Tailwind + cores do tema (claro/escuro) como variáveis
  lib/                  api.js (único fetch; token em memória + renovação automática), cn.js, format.js, tema.js, perfis.js
  components/ui/        Button, Card, Field/Input/Select/Textarea, Badge, Modal, Table, PageHeader, StatCard,
                        LoadingState/EmptyState/Alert, Toast
  layouts/              AppLayout (sidebar + topo + menu do usuário), AuthLayout (login)
  features/
    auth/               AuthContext (useAuth), LoginPage, TrocarSenhaPage, RotaProtegida/RotaAdmin
    chamados/           ChamadosPage, api.js (hooks), components/ (form, detalhe, modal, badges)
    cadastros/          CadastrosPage (admin), CadastroForm, config.js (cores, tipos de status, abas), api.js (useCadastro, useSalvarCadastro)
    usuarios/           UsuariosPage (admin), UsuarioForm, SenhaTemporaria, api.js
    dashboard/          InicioPage, BarrasPorCategoria, api.js (useDashboard)
```

## Regras rápidas
- **Cores só pelos nomes do tema** (`bg-superficie`, `text-texto-suave`, `bg-primaria`, `text-perigo`...). Tema escuro troca as variáveis
  em `index.css`; nenhuma tela usa `dark:` nem cor fixa.
- **Dados do servidor só pelos hooks** de `features/*/api.js` (TanStack Query). Telas não chamam `fetch` nem usam `useEffect` para buscar.
- **Reutilize `components/ui/`** antes de escrever markup novo.
- Filtros e modal ficam na URL (`/chamados?status=1&chamado=7`): recarregar ou compartilhar o link mantém a tela.
