# R-011 — Pré-deploy: segurança e script SQL completo

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 5.1 — Pré-deploy: segurança |
| Branch / commit | sem git |
| Status | Concluído — aguardando validação |

## Pedido
"Prossiga, porém faça nesta etapa também um código SQL completo sem alterações, para ficar em schema de forma atualizada" —
4.6 validada; início da 5.1 (segurança) e, junto, um script SQL que crie o banco já no formato atual, sem `ALTER`.

## O que foi feito
**Banco**
- `database/schema_completo.sql` (novo): cria o banco do zero no estado atual — equivale a `schema.sql` + migrações 001 a 004 —
  com cada tabela já no formato final (sem `ALTER`), índices e chaves nomeados, comentários do que cada campo significa. Partes:
  1. banco (`CREATE DATABASE IF NOT EXISTS`, utf8mb4); 2. tabelas; 3. **dados iniciais obrigatórios** (setores, categorias, prioridades com
  nível/cor, status com tipo/inicial/cor/ordem, primeiro admin); 4. **dados de exemplo opcionais** (João, Mariana, Carlos, Ana e 4 chamados
  com o histórico de abertura); 5. **usuário do app com permissões mínimas** (comentado).
  **Sem `DROP DATABASE`**: se o banco já tiver tabelas, o script para com erro em vez de apagar (resolve B-17).
- `database/schema.sql` **não foi alterado** (regra 1). `database/README.md` explica quando usar cada um; a skill `nova-migracao` agora
  manda refletir cada nova migração no `schema_completo.sql`.

**Backend**
- `shared/limites.js` (novo): **limite de tentativas de login** — 10 erros a cada 15 min por IP + e-mail (um aluno errando não bloqueia o
  laboratório inteiro, que sai pelo mesmo IP) e 100 por IP; resposta 429 em português. Aplicado em `POST /api/auth/login`.
- `app.js`: **`helmet`** (cabeçalhos de segurança, sem `X-Powered-By`), corpo JSON até **100 KB**, `trust proxy` configurável.
- `shared/errors.js`: corpo grande demais → 413.
- `shared/auth.js`: JWT assinado e conferido **só com HS256**.
- `sessoes.repository` / `auth.service` / `server.js`: **faxina** das sessões encerradas ou vencidas há mais de 30 dias, ao subir e 1×/dia.
- `config/env.js`: `TRUST_PROXY`; em produção, avisos se `FRONTEND_URL` não for https ou se o banco usar `root`.
- `package.json`: + `helmet@^8.0.0`, `express-rate-limit@^7.4.1`. `.env.example`: `NODE_ENV`, `TRUST_PROXY`.

**Docs:** `seguranca.md` reescrito como checklist (feito no código × configuração do deploy × pendente), `roadmap.md` (4.6 validada,
5.1 concluída), `decisoes.md` (3), `backlog.md` (B-17 resolvido), `database/README.md`, skill `nova-migracao`; R-010 validado.

## Decisões tomadas
- O script completo é um arquivo **novo**; o `schema.sql` (script da aula, com o histórico das migrações acrescentado) continua seu.
  Se quiser que o completo vire o `schema.sql`, me diga que eu troco (guardando o atual).
- Limite de login por IP + e-mail, não só por IP, por causa dos laboratórios.

## Ação necessária do dono
- [ ] Ler `database/schema_completo.sql` e, se quiser conferir, executar num **banco de teste vazio** (outro nome, ou outro MySQL) —
  não no `helpdesk` atual (ele já tem as tabelas e o script vai parar com erro, de propósito).
- [ ] Dizer se o `schema_completo.sql` deve **substituir** o `schema.sql`.
- [ ] Reiniciar a API e testar: errar a senha 11 vezes com o mesmo e-mail → "Muitas tentativas…"; outro e-mail continua entrando;
  o restante do sistema funciona como antes.
- [ ] Validar a 5.1 e decidir a **5.2 — Deploy**: onde vai rodar (servidor da Univale, VPS, Render/Railway…), domínio e banco de produção.
  O checklist do que configurar está em `docs/seguranca.md` (seção "Configuração do deploy").

## Pendências / próximos passos
- 5.2 Deploy (depende de onde vai hospedar).

## Verificação realizada
- `node --check` em todo o backend; `require` do app — ok.
- Com o banco do teste apontado para uma porta inexistente (nenhuma consulta chegou ao seu MySQL): 11 logins errados com o mesmo e-mail →
  10 passam e o 11º recebe 429 com a mensagem em português; outro e-mail do mesmo IP continua liberado; cabeçalhos do helmet presentes
  (`nosniff`, `SAMEORIGIN`, sem `X-Powered-By`); corpo de 200 KB → 413 — ok.
- **Não executado:** o `schema_completo.sql` (não executo SQL — regra 1). Foi montado a partir do `schema.sql` e das migrações 001–004;
  conferir num banco de teste é o passo acima.
