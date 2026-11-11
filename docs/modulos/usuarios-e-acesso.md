# Usuários e acesso

> Código:
> - backend: `backend/src/modules/auth/`, `backend/src/modules/usuarios/usuarios.repository.js`, `backend/src/shared/auth.js` (4.1, R-004); `usuarios.service/controller/routes` + `shared/senhas.js` (4.4, R-007);
> - frontend: `frontend/src/features/auth/` (4.1, R-004); `frontend/src/features/usuarios/` (4.4, R-007).
> - banco: migração `database/migrations/001_usuarios_setores_sessoes.sql`.
>
> Etapas **4.1** (login) e **4.4** (gestão de usuários). Fonte: pedido do dono em 2026-11-11 (R-000). Índice geral: [../SPEC.md](../SPEC.md).

## Para que serve
Saber **quem** está usando o sistema: o usuário comum abre e acompanha os próprios chamados; o administrador gerencia tudo,
inclusive os próprios usuários.

## Como funciona (processo)
1. O usuário entra com e-mail e senha na tela de login.
2. A API confere a senha (bcrypt) e devolve um **token de acesso** (JWT, curto) e grava um **refresh token** num cookie `httpOnly`.
3. O frontend guarda o token de acesso **só em memória** e o envia em cada chamada (`Authorization: Bearer …`).
4. Quando o token de acesso vence, o frontend pede um novo em `/api/auth/refresh` (o navegador manda o cookie sozinho).
   Ao recarregar a página, o mesmo refresh devolve a sessão sem pedir senha de novo.
5. "Sair" apaga o cookie e invalida o refresh no servidor.
6. Usuário com senha temporária (`trocar_senha = 1`) só consegue abrir a tela "Crie sua senha"; a API responde 403 `TROCAR_SENHA` nas outras rotas.
7. O menu e as rotas mudam conforme o perfil; a API recusa (403) o que o perfil não pode fazer.

## Regras de negócio
- **Dois perfis:** `usuario` (comum) e `admin` (administrador). *(R-000)*
- **Senha nunca é guardada nem devolvida:** só o hash bcrypt (`senha_hash`). *(R-000)*
- **Usuário desativado não entra** e não aparece nas listas de escolha (ex.: responsável), mas continua nos chamados antigos. *(R-000)*
- **Login por e-mail.** *(decisão do dono, R-004)*
- **Só administrador** cria, edita, ativa/desativa usuários e muda perfil; não há autocadastro. *(decisão do dono, R-004)*
- **Senha temporária obriga troca no primeiro acesso.** Nova senha: 8+ caracteres, com letra e número, diferente da atual. *(R-004)*
- **Mesma mensagem para e-mail inexistente e senha errada** ("E-mail ou senha incorretos."), para não revelar quem tem cadastro. *(R-004)*
- **O administrador não tira o próprio perfil de admin nem se desativa**, e **sempre sobra pelo menos um administrador ativo**. *(R-007)*
- **Senha temporária gerada pelo sistema** ao criar ou redefinir (10 caracteres, sem letras ambíguas), mostrada **uma vez** ao admin com botão "Copiar mensagem com o acesso". *(R-007)*
- **Desativar, trocar perfil ou redefinir senha encerra as sessões** da pessoa. *(R-007)*
- **Usuário não é excluído**, só desativado; os chamados dele continuam. *(R-007)*

## Exemplos do dono
> João (Secretaria, usuário comum) entra, vê só os chamados dele e abre um novo.
> Patrick (TI, administrador) entra, vê todos os chamados, assume o do João e gerencia cadastros e usuários.

## Dados *(migração 001)*
| O quê | Onde fica (tabela/campo) | Observação |
|---|---|---|
| Usuário | `usuarios` (id, nome, email único, senha_hash, perfil, setor_id, ativo, trocar_senha, ultimo_acesso, criado_em, atualizado_em) | `perfil` ENUM('usuario','admin') |
| Sessão (refresh) | `sessoes` (id, usuario_id, token_hash SHA-256, user_agent, criado_em, expira_em, revogado_em) | permite "sair" de verdade; token trocado a cada renovação |
| Setor do usuário | `usuarios.setor_id` → `setores` | ver [cadastros.md](cadastros.md) |

## Rotas previstas
| Método e rota | Quem | O quê |
|---|---|---|
| `POST /api/auth/login` | público | e-mail + senha → token de acesso + cookie de refresh |
| `POST /api/auth/refresh` | cookie | novo token de acesso |
| `POST /api/auth/logout` | logado | encerra a sessão |
| `GET /api/auth/me` | logado | dados do usuário logado |
| `PATCH /api/auth/senha` | logado | trocar a própria senha |
| `GET/POST/PATCH /api/usuarios` | admin | listar, criar, editar, ativar/desativar |
| `POST /api/usuarios/:id/redefinir-senha` | admin | nova senha temporária |

## Perguntas em aberto
- [x] Login por e-mail ou matrícula? → **e-mail** (R-004)
- [x] Quem cria usuários? → **só o administrador** (R-004)
- [x] Troca de senha no primeiro acesso? → **sim** (R-004)
- [x] Perfil "técnico"? → **não agora**; dois perfis (R-004)
- [ ] "Esqueci minha senha" por e-mail — futuro (hoje o administrador redefine em Usuários).
