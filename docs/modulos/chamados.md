# Chamados

> Código:
> - backend: `backend/src/modules/chamados/` (routes, controller, service, `chamados.repository`, `historico.repository` — Fase 2, 4.2, 4.5);
> - frontend: `frontend/src/features/chamados/` (Fase 3, R-003).
>
> Etapas **2**, **3**, **4.2** e **4.5**. Fonte: código atual e pedido do dono em 2026-11-11 (R-000). Índice geral: [../SPEC.md](../SPEC.md).

## Para que serve
Registrar um pedido de suporte e acompanhar o atendimento até a solução, com quem pediu, quem atende e tudo o que aconteceu no caminho.

## Como vai funcionar (processo)
**Usuário comum**
1. Entra e vê **"Meus chamados"** (só os que ele abriu), com status e responsável.
2. Abre um chamado: título, descrição, categoria e prioridade (sugestão). Setor vem do cadastro dele. Status inicial "Aberto".
3. Enquanto o chamado está **Aberto**, pode corrigir título, descrição, categoria e prioridade, ou **cancelar**. Depois que a equipe começa, só consulta.
4. Acompanha o **histórico** (mudanças e observações não internas) e **manda mensagens** para a equipe. *(4.5)*
5. Chamado **Resolvido** que voltou a dar problema: **reabre** em até 7 dias, contando o motivo. *(4.5)*

**Administrador**
1. Vê **todos** os chamados; pesquisa e filtra por status, categoria, prioridade, setor e responsável.
2. Abre o detalhe: dados do chamado, **dados do solicitante** (nome, e-mail, setor), histórico.
3. Altera status, prioridade, setor e demais dados; cancela; **exclui definitivamente** (só testes/duplicados). *(4.2)*
4. **Assume** o chamado ("Assumir atendimento") ou escolhe outro responsável na edição; registra observações, **internas** ou não. *(4.5)*
5. Cada uma dessas ações grava uma linha no **histórico** (quem, quando, o que mudou de → para).

## Regras de negócio
- **Solicitante = usuário logado** que abriu; não é digitado. *(R-000)*
- **Responsável é um administrador ativo** (ou nenhum, enquanto ninguém assumiu). *(R-000)*
- **Usuário comum só vê e mexe nos próprios chamados.** A API filtra por `usuario_solicitante_id`; tentar abrir chamado de outro → 404. *(R-005)*
- **Usuário comum edita o próprio chamado só enquanto Aberto** (título, descrição, categoria, prioridade). *(decisão do dono, R-005)*
- **Prioridade: o usuário sugere, o administrador ajusta.** *(decisão do dono, R-005)*
- **Setor copiado do usuário na abertura**; o administrador pode corrigir. *(R-005)*
- **Status, setor e responsável só são alterados pelo administrador.** *(R-005)*
- **Desistência = Cancelado:** o solicitante cancela enquanto Aberto; o administrador cancela qualquer um. **Exclusão definitiva só pelo administrador**, para testes ou duplicados. *(decisão do dono, R-005)*
- **Toda mudança vira histórico**, na mesma transação da alteração. *(R-000)*
- **Ao assumir um chamado Aberto, o status passa ao primeiro status do tipo "Em andamento".** *(decisão do dono, R-009)*
- **Observação interna** só a equipe vê; o solicitante pode comentar no próprio chamado (menos em cancelado). *(decisão do dono, R-009)*
- **Reabertura:** só de chamado Resolvido; o solicitante tem **7 dias** após o encerramento (admin, sem prazo); exige motivo; volta ao status inicial e mantém o responsável. *(decisão do dono, R-009)*
- **Data de encerramento** entra ao resolver/cancelar e sai ao voltar para aberto/andamento. *(R-009)*

## Exemplos do dono
> João abriu o chamado "Impressora não imprime" (Secretaria, Hardware, Média). Patrick está atendendo.
> Histórico esperado:
> - 11/11 09:02 — João abriu o chamado (status Aberto)
> - 11/11 09:30 — Patrick assumiu o chamado (responsável: Patrick; status Aberto → Em atendimento)
> - 11/11 09:35 — Patrick: "Fila travada, reiniciei o spooler" (observação)
> - 11/11 10:10 — Patrick alterou o status Em atendimento → Resolvido

## Dados
| O quê | Onde fica (tabela/campo) | Observação |
|---|---|---|
| Chamado | `chamados` (id, titulo, descricao, categoria_id, prioridade_id, status_id, data_abertura, data_atualizacao) | existe |
| Solicitante | `chamados.usuario_solicitante_id` → `usuarios` (nome e e-mail vêm do cadastro) | migração 002 |
| Responsável | `chamados.usuario_responsavel_id` → `usuarios` (nulo = ninguém assumiu) | migração 004 |
| Setor | `chamados.setor_id` → `setores` | migração 002 |
| Data de encerramento | `chamados.data_encerramento` | migração 004; prazo de reabertura e tempo de atendimento |
| Histórico | `chamado_historico` (id, chamado_id, usuario_id, tipo, valor_anterior, valor_novo, texto, interna, criado_em) | migração 004; `tipo`: abertura, edicao, status, prioridade, responsavel, observacao, reabertura |

## Perguntas em aberto
- [x] Excluir × cancelar → **os dois**: Cancelado no dia a dia, exclusão só admin (R-005)
- [x] Usuário edita o próprio chamado → **só enquanto Aberto** (R-005)
- [x] Prioridade → **usuário sugere, admin ajusta** (R-005)
- [x] Setor do chamado → **copiado do usuário** (R-005)
- [x] Chamados de teste → **solicitantes viraram usuários** (migração 002)
- [x] Observações internas → **sim**, marcador por observação (R-009)
- [x] Solicitante comenta → **sim** (R-009)
- [x] Reabrir → **sim, em até 7 dias**, com motivo (R-009)
- [x] Assumir muda o status → **sim** (R-009)
