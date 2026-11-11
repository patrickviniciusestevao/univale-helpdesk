# R-004 — Usuários e login

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.1 — Usuários e login |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11); migração 001 executada |

## Pedido
"Acatado, concordo, prossiga" — validação da Fase 3 e aceite das recomendações: **login por e-mail**, **só o administrador cria
usuários**, **troca de senha obrigatória no primeiro acesso**, **dois perfis** (usuário e administrador). Início da 4.1.

## O que foi feito
**Banco** — proposta, **não executada**
- `database/migrations/001_usuarios_setores_sessoes.sql`: tabelas `setores` (com os 6 setores do dono), `usuarios` (perfil, setor,
  ativo, `trocar_senha`, último acesso) e `sessoes` (hash do refresh token, validade, encerramento), e o **primeiro administrador**
  (`admin@helpdesk.local`, senha temporária `Trocar@123`, setor TI). Linha no índice de `database/README.md`.

**Backend**
- Dependências: `bcryptjs`, `jsonwebtoken`, `cookie-parser`.
- `config/env.js`: `JWT_SECRET` obrigatório (a API não sobe sem ele, com instrução de como gerar), `JWT_EXPIRA_EM` (15m), `SESSAO_DIAS` (7),
  `FRONTEND_URL`. `.env.example` atualizado.
- `shared/auth.js`: `PERFIS`, `gerarTokenAcesso`, `autenticar` (Bearer; 401 com `TOKEN_EXPIRADO`/`TOKEN_INVALIDO`), `exigirSenhaTrocada`
  (403 `TROCAR_SENHA`), `exigirPerfil` (pronto para as rotas de admin).
- `modules/auth/` (routes, controller, service, `sessoes.repository`): login (mesma mensagem para e-mail ou senha errados; tempo de
  resposta igual mesmo se o e-mail não existir), refresh com **troca do token a cada uso**, logout que encerra a sessão no banco,
  `/me`, troca de senha (confere a atual, exige 8+ caracteres com letra e número, devolve novo token).
- `modules/usuarios/usuarios.repository.js`: consultas de usuário (a senha só sai para o login).
- `modules/cadastros`: `setores` incluído.
- `app.js`: CORS só para o `FRONTEND_URL` com cookie; `/api/chamados` e `/api/cadastros` agora exigem login e senha já trocada.

**Frontend**
- `lib/api.js`: token de acesso só na memória; `credentials: "include"` para o cookie; ao receber 401, renova a sessão uma vez (renovações
  simultâneas esperam a mesma) e repete a chamada; se não der, avisa o `AuthProvider`, que volta ao login.
- `features/auth/`: `AuthContext` (`useAuth`: usuário, entrar, sair, trocar senha; recupera a sessão ao recarregar a página),
  `RotaProtegida` (sem login → `/login`, voltando depois para onde estava; senha temporária → `/trocar-senha`), `RotaAdmin` (pronta para a 4.3),
  `LoginPage`, `TrocarSenhaPage` (primeiro acesso ou pelo menu), `CampoSenha` (mostrar/ocultar).
- `layouts/AuthLayout.jsx`: tela dividida (apresentação à esquerda no computador, formulário à direita).
- `layouts/AppLayout.jsx`: menu do usuário no topo (iniciais, nome, perfil, setor, "Trocar senha", "Sair"); itens do menu já filtram por perfil.
- `lib/perfis.js`, `routes.jsx` (`/login`, `/trocar-senha`, demais protegidas), `main.jsx` (`AuthProvider`).

**Docs:** `roadmap.md`, `decisoes.md` (5), `backlog.md` (B-02 parcial), `seguranca.md` (CORS resolvido; rate limit e limpeza de sessões
pendentes; senha temporária no repositório), `SPEC.md`, `HARNESS.md`, `modulos/usuarios-e-acesso.md` (regras e perguntas respondidas),
`backend/README.md`, `frontend/README.md`; R-003 marcado como validado.

## Decisões tomadas
- `bcryptjs` no lugar de `bcrypt`: mesmo algoritmo e mesma API, sem compilação nativa (evita erro de instalação no Windows dos alunos).
- Refresh token em cookie restrito a `/api/auth`; no banco, só o hash. Token de acesso nunca vai para `localStorage`.
- Nesta etapa, quem está logado ainda vê **todos** os chamados e o solicitante continua sendo digitado — separar "meus chamados" × "todos"
  é a 4.2.

## Ação necessária do dono
- [ ] **Executar a migração** `database/migrations/001_usuarios_setores_sessoes.sql` no MySQL local (se quiser, troque antes o e-mail do admin).
  Depois, me avise para eu marcar como executada.
- [ ] **Acrescentar no `backend/.env`**: `JWT_SECRET=` com um valor gerado por
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` (sem isso a API não sobe). Os outros têm padrão.
- [ ] Reiniciar a API e o frontend e testar:
  - abrir `http://localhost:5173` → vai para o login;
  - senha errada → "E-mail ou senha incorretos.";
  - `admin@helpdesk.local` / `Trocar@123` → tela "Crie sua senha" (sem acesso ao resto até trocar);
  - trocar a senha → entra no sistema; nome e perfil aparecem no topo;
  - recarregar a página (F5) → continua logado;
  - "Sair" → volta ao login; recarregar → continua deslogado;
  - menu do usuário → "Trocar senha" funciona e "Voltar" retorna.
- [ ] Validar a 4.1 e autorizar a **4.2** (chamado com dono). Antes dela, responder as perguntas de chamados do R-000 / `modulos/chamados.md`
  (excluir × cancelar, usuário edita o próprio chamado, quem escolhe a prioridade, setor do chamado, observações internas, reabrir,
  o que fazer com os 4 chamados de teste).

## Pendências / próximos passos
- 4.2: `usuario_solicitante_id` no chamado (nova migração), "Meus chamados" × todos, solicitante = usuário logado.
- Pré-deploy: rate limit no login, limpeza de sessões vencidas.

## Verificação realizada
- `node --check` em todo o backend; `npm run build` do frontend — ok.
- Com um `JWT_SECRET` de teste, subi o `app.js` numa porta temporária e conferi sem banco: sem token (401), token inválido (401
  `TOKEN_INVALIDO`), vencido (401 `TOKEN_EXPIRADO`), senha temporária (403 `TROCAR_SENHA`), token válido passa, validação do login e da
  nova senha (400), refresh sem cookie (401), `/me` sem token (401), CORS devolvendo só `http://localhost:5173` — ok.
- Conferi que o hash da senha temporária na migração corresponde a `Trocar@123`.
- **Não testado:** login de verdade, renovação, troca de senha e telas no navegador — dependem da migração executada no seu banco.
