# Segurança — pré-deploy

> Revisado na etapa 5.1 (R-011). ✅ feito no código · ⚙️ configuração no servidor/`.env` (na hora do deploy, 5.2) · ⏳ pendente.
> Índice geral: [SPEC.md](SPEC.md). Etapas: [roadmap.md](roadmap.md).

## Aplicação
| Item | Situação | Onde |
|---|---|---|
| Senhas com bcrypt (custo 10); nova senha com 8+ caracteres, letra e número | ✅ | `shared/senhas.js`, `auth.routes.js` |
| JWT de acesso de 15 min (só na memória do navegador), assinatura HS256 fixa | ✅ | `shared/auth.js` |
| Refresh token em cookie `httpOnly`, `SameSite=Lax`, `path=/api/auth`, `Secure` em produção; só o hash no banco; troca a cada uso | ✅ | `auth.controller.js`, `auth.service.js` |
| Mesma resposta (e mesmo tempo) para e-mail inexistente e senha errada | ✅ | `auth.service.js` |
| **Limite de tentativas de login**: 10 erros/15 min por IP+e-mail; 100/15 min por IP | ✅ | `shared/limites.js` |
| Permissões conferidas no servidor em toda rota (perfil, dono do chamado, senha temporária) | ✅ | `shared/auth.js`, services |
| Desativar usuário, trocar perfil ou redefinir senha encerra as sessões | ✅ | `usuarios.service.js` |
| Faxina diária das sessões encerradas/vencidas há mais de 30 dias | ✅ | `server.js`, `sessoes.repository.js` |
| Cabeçalhos de segurança (`helmet`); sem `X-Powered-By` | ✅ | `app.js` |
| Corpo JSON até 100 KB (413 acima disso) | ✅ | `app.js`, `shared/errors.js` |
| CORS só para `FRONTEND_URL`, com credenciais | ✅ | `app.js` |
| SQL sempre parametrizado (`?`); nomes de tabela/coluna só de listas fixas | ✅ | repositories |
| Erros internos sem detalhes para o cliente (stack/SQL só no console do servidor) | ✅ | `shared/errors.js` |
| XSS: React escapa por padrão; nenhum `dangerouslySetInnerHTML` | ✅ | frontend |
| API não sobe sem `JWT_SECRET` de 32+ caracteres; avisos em produção (FRONTEND_URL sem https, DB_USER root) | ✅ | `config/env.js` |

## Configuração do deploy (5.2)
| Item | Situação | Como |
|---|---|---|
| `NODE_ENV=production` (ativa cookie `Secure` e avisos) | ⚙️ | `backend/.env` |
| **`JWT_SECRET` novo** (nunca o de desenvolvimento) | ⚙️ | gerar com o comando do `.env.example` |
| `FRONTEND_URL` com o endereço **https** real | ⚙️ | `backend/.env` |
| `TRUST_PROXY=1` se houver proxy (Nginx, Render, Railway...) | ⚙️ | `backend/.env` |
| HTTPS no endereço público (certificado) | ⚙️ | servidor / hospedagem |
| Frontend e API no **mesmo site** (ex.: `helpdesk.univale.br` e `helpdesk.univale.br/api` ou `api.helpdesk.univale.br`) — o cookie `SameSite=Lax` não vai entre sites diferentes | ⚙️ | DNS / proxy |
| Banco sem porta pública; **usuário do app sem root** (`schema_completo.sql`, parte 5) | ⚙️ | MySQL |
| Senha do banco de produção diferente da de desenvolvimento e da do servidor | ⚙️ | MySQL / `.env` |
| Primeiro admin: trocar o e-mail no script e entrar logo após criar o banco (senha temporária `Trocar@123` está no repositório) | ⚙️ | `schema_completo.sql` |
| Não executar a parte 4 (dados de exemplo) do `schema_completo.sql` em produção | ⚙️ | MySQL |
| `.env` e `docs/infra/` fora do git (já no `.gitignore`) | ✅ | `.gitignore` |
| Backup automático do banco | ⏳ | hospedagem / cron |

## Para depois (não bloqueia o deploy)
- Recuperação de senha por e-mail (hoje o admin redefine).
- Registro de auditoria de ações administrativas além do histórico de chamados.
- Atualizar dependências com avisos do `npm audit` (sem `--force`, testando).
