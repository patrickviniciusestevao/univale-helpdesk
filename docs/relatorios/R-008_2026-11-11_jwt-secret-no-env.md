# R-008 — JWT_SECRET no .env local

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.4 — correção de configuração |
| Branch / commit | sem git |
| Status | Concluído |

## Pedido
O dono colou o erro do nodemon: a API não subia — "Defina JWT_SECRET (mínimo 32 caracteres) em backend/.env".

## O que foi feito
- Conferido `backend/.env` (só nomes e tamanhos, sem exibir valores): tinha apenas as variáveis do banco; a linha `JWT_SECRET`
  pedida na 4.1 (R-004) nunca foi acrescentada.
- Acrescentado ao `backend/.env` (arquivo local, fora do git): `JWT_SECRET` aleatório de 96 caracteres (só de desenvolvimento),
  `JWT_EXPIRA_EM=15m`, `SESSAO_DIAS=7`, `FRONTEND_URL=http://localhost:5173`. Cópia de segurança feita antes e removida após conferir.

## Ação necessária do dono
- [ ] Reiniciar a API: no terminal do nodemon digite `rs` e Enter (o nodemon não reinicia sozinho quando só o `.env` muda).
- [ ] Como até agora a API não subia com login, testar em sequência os itens dos relatórios R-004 (login, troca de senha), R-005, R-006 e R-007.
- [ ] Em produção, gerar outro `JWT_SECRET` (nunca reutilizar este).

## Verificação realizada
- `require('./src/config/env')` carrega sem erro com o novo `.env`.
