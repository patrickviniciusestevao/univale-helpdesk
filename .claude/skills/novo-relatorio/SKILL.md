---
name: novo-relatorio
description: Gera o relatório de desenvolvimento obrigatório (docs/relatorios/R-NNN_AAAA-MM-DD_titulo.md) de um prompt que alterou o projeto Univale Helpdesk e atualiza o índice e os documentos do assunto. Use ao final de toda etapa ou alteração, antes do commit (o hook do harness bloqueia commit sem relatório).
---

# Novo relatório de desenvolvimento — Univale Helpdesk

Todo prompt que altera o projeto gera um relatório (HARNESS.md, regra 3). Escreva para o dono e para quem vier depois:
português claro, o que mudou e por quê, onde no código, e o que o dono precisa fazer.

## Passos
1. Próximo número: maior `R-NNN` em `docs/relatorios/` + 1 (nunca reutilizar).
2. Crie `docs/relatorios/R-NNN_AAAA-MM-DD_titulo-curto.md` com o modelo de `docs/relatorios/README.md`:
   - **Cabeçalho:** data, fase/etapa (como em `docs/roadmap.md`), branch/commit (`sem git` enquanto o projeto não tiver repositório; depois `<branch> / commit tipo(etapa-x.y)`),
     status (`Concluído — aguardando validação`, `Definido — aguardando o dono`…).
   - **Pedido:** resumo do que o dono pediu (incluindo validações e decisões que ele informou).
   - **O que foi feito:** cada mudança com o arquivo (`caminho/arquivo`); backend, frontend, banco e docs separados.
   - **Decisões tomadas:** e o motivo.
   - **Ação necessária do dono:** checklist `- [ ]` concreto (como testar, o que validar, migração a executar).
   - **Verificação realizada:** o mínimo feito (build, `node --check`, lint) e o que **não** foi testado — honestamente.
3. Índice em `docs/relatorios/README.md`: nova linha `| [R-NNN](arquivo) | data | etapa | título | — |` (com git: hash do commit da etapa).
4. Documentos do assunto (só o que mudou):
   - status da etapa → `docs/roadmap.md`;
   - decisão nova → linha em `docs/decisoes.md` (não reescrever as antigas);
   - problema/melhoria → `docs/backlog.md`;
   - regra de um módulo → `docs/modulos/<modulo>.md`;
   - visão, princípios ou arquitetura → `docs/SPEC.md`.
5. Validações informadas pelo dono: marque `[x]` nos relatórios correspondentes e mude o status para `Validado pelo dono (data)`.
6. Commit (HARNESS.md, regra 6): commit único da etapa na `main`, **sem push**, mensagem `tipo(etapa-x.y): resumo`.
   O repositório é público: confira que nenhum segredo entra no commit.
