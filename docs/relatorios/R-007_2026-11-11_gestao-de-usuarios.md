# R-007 — Gestão de usuários

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.4 — Gestão de usuários |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11) |

## Pedido
"Feito, prossiga" — migração 003 executada, 4.3 validada, início da 4.4: o administrador cria, edita, define perfil e setor,
ativa/desativa e redefine a senha dos usuários.

## O que foi feito
**Banco:** nenhuma migração (a tabela `usuarios` já tinha tudo). Migração 003 marcada como **Executada** (local, 2026-11-11).

**Backend**
- `shared/senhas.js` (novo): bcrypt num lugar só (`gerarHash`, `conferir`, `HASH_FALSO`) e `gerarSenhaTemporaria` (10 caracteres, com
  letra e número, sem 0/O/1/l/I). `auth.service` passou a usar este módulo.
- `modules/usuarios/` — `usuarios.service`, `controller`, `routes` (novos) e `repository` (listar, inserir, atualizar, senha temporária,
  contar admins ativos, e-mail em uso):
  - criar com **senha temporária gerada pelo sistema**, devolvida uma vez na resposta (no banco só o hash);
  - editar nome, e-mail, perfil, setor, ativo; e-mail repetido → 409;
  - proteções: não tira o próprio perfil de admin, não se desativa, **sempre sobra 1 admin ativo**;
  - desativar ou trocar o perfil **encerra as sessões** da pessoa;
  - **redefinir senha**: nova temporária, troca obrigatória, sessões encerradas (não vale para a própria senha).
- `auth/sessoes.repository`: `revogarTodasDoUsuario`.
- `app.js`: `/api/usuarios` só para administrador.

**Frontend** (`features/usuarios/`)
- `UsuariosPage`: busca (nome, e-mail, setor), filtros de perfil e situação, "Limpar filtros", contador; tabela no computador e cartões no
  celular com perfil, setor, último acesso ("há 2 dias" / "Nunca entrou"), situação (Ativo/Inativo, "Senha temporária"); "(você)" na sua linha.
- Modal criar/editar (`UsuarioForm`) com perfil e "ativo" travados quando é você; botão **Redefinir senha** com confirmação.
- `SenhaTemporaria`: mostra a senha **uma vez**, com aviso e botão **"Copiar mensagem com o acesso"** (texto pronto com e-mail e senha).
- Menu **Administração › Usuários**; rota `/usuarios` em `RotaAdmin`.

**Docs:** `roadmap.md`, `decisoes.md` (4), `SPEC.md`, `seguranca.md`, `modulos/usuarios-e-acesso.md`, `backend/README.md`, `frontend/README.md`;
R-006 validado.

## Decisões tomadas
- Senha temporária gerada pelo sistema (o admin nunca escolhe nem conhece a senha definitiva de ninguém).
- Usuário não é excluído, só desativado.
- Quem é desativado ou muda de perfil continua com o acesso atual por no máximo 15 min (validade do token); depois precisa entrar de novo.

## Ação necessária do dono
- [ ] Reiniciar a API e testar como admin em **Administração › Usuários**:
  - criar um usuário → aparece a senha temporária; "Copiar mensagem com o acesso"; entrar com ele em outra janela anônima → troca de senha;
  - criar com um e-mail que já existe → aviso;
  - editar você mesmo → perfil e "Ativo" travados;
  - desativar um usuário → ele não consegue entrar ("Usuário desativado"); reativar;
  - "Redefinir senha" de alguém → nova senha temporária; a sessão dele cai (em até 15 min);
  - promover alguém a administrador e conferir o menu "Administração" para ele.
- [ ] Validar a 4.4 e autorizar a **4.5 (Atendimento: responsável, observações e histórico)**. Antes, decidir:
  - **observações internas** (só a equipe vê) × todas visíveis ao solicitante? (recomendo: marcador "interna" por observação);
  - o **solicitante pode comentar** no chamado (ex.: responder uma pergunta da equipe)? (recomendo: sim, como observação dele);
  - o solicitante pode **reabrir** um chamado resolvido? (recomendo: sim, em até 7 dias; volta ao status inicial e fica no histórico);
  - ao **assumir** um chamado Aberto, mudar automaticamente para o primeiro status "Em andamento"? (recomendo: sim).

## Pendências / próximos passos
- 4.5 Atendimento (migração para responsável e histórico).

## Verificação realizada
- `node --check` em todo o backend; `npm run build` do frontend — ok.
- Regras do service testadas com repositórios falsos: não tira o próprio admin (400), não se desativa (400), e-mail repetido ao criar e ao
  editar (409), último admin ativo protegido (400), senha temporária gerada e só o hash salvo, desativar e redefinir encerram sessões, não
  redefine a própria senha (400), lista sem hash — ok.
- Rotas sem banco: usuário comum → 403; validações → 400; não existe DELETE (404) — ok.
- **Não testado:** telas com dados reais.
