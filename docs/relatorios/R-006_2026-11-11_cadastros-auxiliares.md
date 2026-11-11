# R-006 — Cadastros auxiliares

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.3 — Cadastros auxiliares |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11); migração 003 executada |

## Pedido
"Feito, de acordo, autorizado, prossiga" — migração 002 executada, 4.2 validada, 4.3 autorizada com a proposta de marcadores
(status: inicial/encerra/cor/ordem; prioridade: nível/cor/ordem).

## O que foi feito
**Banco** — proposta, **não executada**
- `database/migrations/003_marcadores_status_prioridade.sql`: status ganham `tipo`, `inicial`, `cor`, `ordem` (preenchidos para os 4 atuais);
  prioridades ganham `nivel` e `cor` (Baixa 1, Média 2, Alta 3); sai o `DEFAULT 1` de `chamados.status_id`. Linha no índice.
- Migração 002 marcada como **Executada** (local, 2026-11-11).

**Backend** (`modules/cadastros/`)
- `cadastros.tipos.js` (novo): configuração de cada lista (tabela, colunas, ordenação, tamanho do nome, textos), cores e tipos de status.
- `cadastros.routes.js`: `POST /api/cadastros/:tipo` e `PATCH /api/cadastros/:tipo/:id` só para admin, validação Zod com os campos
  extras de cada tipo; sem DELETE.
- `cadastros.service.js`: criar/atualizar com mensagens ("Setor cadastrado.", "Status desativado."...); regras do **status inicial** (um só,
  ativo, tipo Aberto; marcar outro desmarca o anterior numa transação); `statusInicialId` e `statusCancelamentoId` no lugar da busca por nome.
- `cadastros.repository.js`: inserir/atualizar genéricos (só colunas da configuração), consultas de status inicial e por tipo.
- `chamados`: consulta devolve `status_tipo`, `status_cor`, `prioridade_nivel`, `prioridade_cor`; chamado novo recebe o **status inicial do
  cadastro**; editar/cancelar usam o **tipo** do status (não mais o nome).

**Frontend**
- `features/cadastros/CadastrosPage.jsx` (novo): abas Categorias / Prioridades / Status / Setores (na URL), lista com prévia da cor,
  marca "Inicial" e "Inativo", botões **Desativar/Reativar** e **Editar**, "Novo …"; contador de itens e ativos.
- `CadastroForm.jsx` (novo): nome; status — tipo (com explicação), ordem, cor, "status inicial"; prioridade — nível e cor; prévia da etiqueta;
  "Ativo". O status inicial atual fica travado (não desmarca nem desativa).
- `config.js` (novo), `api.js` (`useSalvarCadastro`), `components/ui/Field.jsx` (+ `Checkbox`).
- Badges de status/prioridade com a **cor do cadastro**; permissões e indicadores da Início pelo **tipo** do status.
- Menu com seção **Administração › Cadastros** (só admin); rota `/cadastros` dentro de `RotaAdmin`.

**Docs:** `roadmap.md`, `decisoes.md` (5), `backlog.md` (B-19, B-25, B-27 resolvidos; B-14 e B-26 parciais), `SPEC.md`,
`modulos/cadastros.md` (reescrito), `backend/README.md`, `frontend/README.md`; R-005 validado.

## Decisões tomadas
- **Tipo do status** no lugar do marcador "encerra": diz o mesmo (Resolvido e Cancelado encerram) e ainda indica o destino do botão
  "Cancelar chamado" e o que contar em cada card do dashboard, mesmo que o admin renomeie os status.
- Prioridade sem campo "ordem": o **nível** já ordena.
- Cor guardada como nome de cor do tema (não hexadecimal).

## Ação necessária do dono
- [ ] **Executar** `database/migrations/003_marcadores_status_prioridade.sql` e me avisar. (Sem ela, abrir chamado falha: o sistema procura o status inicial.)
- [ ] Reiniciar a API e testar como admin em **Administração › Cadastros**:
  - criar um setor; desativar e reativar; conferir que o desativado some do formulário de chamado (e continua nos chamados antigos);
  - tentar criar um nome repetido → aviso;
  - mudar a cor de "Alta" → a etiqueta muda na lista de chamados;
  - criar o status "Aguardando peça" (tipo Em andamento, amarelo) e usar num chamado; como usuário dono, o Editar some;
  - marcar outro status do tipo Aberto como inicial → o anterior perde a marca; abrir um chamado novo → nasce com o novo inicial;
  - tentar desativar o status inicial → bloqueado.
- [ ] Como usuário comum, abrir `/cadastros` → volta para o Início (e a API recusa com 403).
- [ ] Validar a 4.3 e autorizar a **4.4** (gestão de usuários: criar, editar, perfil, setor, ativar/desativar, redefinir senha).

## Pendências / próximos passos
- 4.4 Gestão de usuários.

## Verificação realizada
- `node --check` em todo o backend; `npm run build` do frontend — ok.
- Regras do service de cadastros testadas com repositório falso em memória: não desativa/desmarca o inicial, inicial só do tipo Aberto,
  novo inicial desmarca o anterior (em transação), reativação, status de cancelamento ausente → aviso, tipo inexistente → 404 — ok.
- Rotas sem banco: usuário comum criando → 403; tipo inexistente → 404; validações de nome, tipo, cor, ordem, nível, id e corpo vazio → 400 — ok.
- **Não testado:** a migração 003 e as telas com dados reais.
