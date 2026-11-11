# R-009 — Atendimento: responsável, observações e histórico

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.5 — Atendimento |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11); migração 004 executada |

## Pedido
"Feito, aprovado, prossiga" — 4.4 validada (com a correção do R-008), início da 4.5. Sem resposta explícita às quatro perguntas do R-007,
segui as recomendações (o dono pode mudar qualquer uma):
1. observações podem ser **internas** (só a equipe vê);
2. o **solicitante pode comentar** no próprio chamado;
3. **reabrir** chamado Resolvido em até **7 dias**, com motivo, voltando ao status inicial;
4. **assumir** um chamado Aberto o passa para o primeiro status "Em andamento".

## O que foi feito
**Banco** — proposta, **não executada**
- `database/migrations/004_responsavel_e_historico.sql`: `chamados.usuario_responsavel_id` e `chamados.data_encerramento` (preenchida para os
  já encerrados); tabela `chamado_historico` (tipo, valores antes/depois como texto, texto, interna, quem, quando); linha de **abertura**
  para cada chamado existente. Linha no índice.

**Backend** (`modules/chamados/`)
- `historico.repository.js` (novo): gravar linha e listar (sem as internas para o solicitante).
- `chamados.repository.js`: responsável (nome) e data de encerramento na consulta; gravações aceitam transação.
- `chamados.service.js`: **toda alteração grava chamado + histórico na mesma transação**; o histórico descreve o que mudou (status,
  prioridade, responsável, e uma linha de "edição" para título/descrição/categoria/setor). Novas ações: **assumir** (admin),
  **comentar** (interna só admin; solicitante não comenta em cancelado), **reabrir** (só Resolvido; solicitante até 7 dias; motivo
  obrigatório), **histórico**. Responsável só pode ser **administrador ativo**. Data de encerramento acompanha o status.
- `chamados.routes.js`: `POST /:id/assumir` (admin), `POST /:id/observacoes`, `POST /:id/reabrir`, `GET /:id/historico`;
  `usuario_responsavel_id` no PATCH (só admin).
- `cadastros.service`: `primeiroStatusDoTipo(tipo)` (usado ao cancelar e ao assumir).

**Frontend** (`features/chamados/`)
- `ChamadoHistorico.jsx` (novo): linha do tempo com ícone por tipo ("Patrick assumiu o atendimento", "mudou o status de Aberto para Em
  atendimento", "reabriu o chamado — Motivo: …"), hora relativa (data completa ao passar o mouse), observações internas destacadas
  ("Interna — só a equipe vê"); caixa para escrever, com "Observação interna" para o admin.
- `ChamadoModal.jsx`: visualização em **duas colunas** (detalhe | histórico), botões **Assumir atendimento**, **Reabrir** (pede o motivo),
  Editar, Cancelar, Excluir conforme a permissão; avisos para o solicitante (em atendimento / prazo de reabertura vencido).
- `ChamadoForm.jsx`: admin escolhe o **Responsável** (administradores ativos). `ChamadoDetalhe.jsx`: responsável e "Encerrado em".
- `ChamadosPage.jsx`: coluna **Responsável** (admin) e "Atendido por …" nos cartões. `permissoes.js`: assumir, comentar, interna, reabrir
  (com o prazo). `api.js`: hooks de histórico, assumir, comentar, reabrir. `Modal`: tamanho `xl`. `usuarios/api.js`: `useUsuarios({ enabled })`.

**Docs:** `roadmap.md` (4.4 validada, 4.5 concluída), `decisoes.md` (5), `backlog.md` (B-21 resolvido), `SPEC.md` (módulo e glossário),
`modulos/chamados.md`, `backend/README.md`; R-007 validado.

## Decisões tomadas
- Reabrir mantém o responsável (quem atendeu continua) e volta ao status inicial.
- Excluir definitivamente apaga também o histórico (é só para testes/duplicados).

## Ação necessária do dono
- [ ] **Executar** `database/migrations/004_responsavel_e_historico.sql` e me avisar.
- [ ] Reiniciar a API e testar:
  - como **João**: abrir um chamado → o histórico mostra "João abriu o chamado"; escrever uma mensagem para a equipe;
  - como **admin**: abrir o chamado do João → **Assumir atendimento** → status vira "Em atendimento" e você aparece como responsável;
    registrar uma observação **interna** e outra normal; mudar a prioridade; resolver (editar → status Resolvido);
  - como João: não vê a observação interna; vê a normal; botão **Reabrir** pede o motivo → chamado volta para Aberto;
  - como admin: na edição, trocar o responsável para outro administrador; conferir a coluna Responsável na lista.
- [ ] Validar a 4.5 e autorizar a **4.6** (dashboard com contas no servidor: total, abertos, em atendimento, resolvidos, alta prioridade,
  por categoria, recentes; filtros por setor e responsável; paginação).

## Pendências / próximos passos
- 4.6 Dashboard e filtros (B-14, B-22, B-26).

## Verificação realizada
- `node --check` em todo o backend; `npm run build` do frontend — ok.
- Regras testadas com repositórios falsos: abertura no histórico; assumir (Aberto → Em atendimento + responsável; repetido 400; encerrado 400);
  responsável inativo 400; usuário definindo responsável 403; prioridade + título geram linhas certas; interna só do admin; solicitante não
  vê internas; resolver preenche encerramento; reabrir volta ao inicial, limpa encerramento e mantém responsável; reabrir não resolvido 400;
  após 8 dias 403 para o solicitante e ok para o admin; comentar em cancelado 400 — ok.
- Rotas sem banco: assumir como usuário 403; validações de observação, motivo, responsável e id 400 — ok.
- **Não testado:** a migração 004 e as telas com dados reais.
