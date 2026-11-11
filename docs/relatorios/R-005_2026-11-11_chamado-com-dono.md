# R-005 — Chamado com dono

| Campo | Valor |
|---|---|
| Data | 2026-11-11 |
| Fase / etapa | 4.2 — Chamado com dono |
| Branch / commit | sem git |
| Status | Validado pelo dono (2026-11-11); migração 002 executada |

## Pedido
"Feito, validado, prossiga" — migração 001 executada, 4.1 validada, início da 4.2. Decisões do dono nesta etapa:
- desistência: **os dois** — status "Cancelado" no dia a dia e exclusão definitiva só para o administrador;
- usuário comum edita o próprio chamado **só enquanto Aberto**;
- prioridade: **usuário sugere, administrador ajusta**;
- chamados de teste: **solicitantes viram usuários de teste**.

## O que foi feito
**Banco** — proposta, **não executada**
- `database/migrations/002_chamado_com_dono.sql`: status **Cancelado**; cria um usuário comum para cada e-mail que aparece nos chamados
  (João, Mariana, Carlos, Ana e os que você criou testando; senha temporária `Trocar@123`; setores dos 4 de teste); colunas
  `usuario_solicitante_id` (obrigatória) e `setor_id` no chamado, preenchidas a partir do e-mail (sem e-mail → primeiro admin); chaves,
  índices; **remove as colunas de texto `solicitante` e `email`** (nome e e-mail passam a vir do cadastro). Linha no índice.
- `database/migrations/001_...sql` e índice: marcada como **Executada** (local, 2026-11-11).

**Backend**
- `chamados.repository`: consulta traz solicitante (nome, e-mail) e setor pelos cadastros; lista com filtro por solicitante.
- `chamados.service`: regras por perfil — usuário comum lista/vê só os seus (chamado de outro → 404), abre com solicitante = ele e setor
  copiado do cadastro, edita só enquanto Aberto e sem status/setor (403 com mensagem clara), cancela só enquanto Aberto; administrador vê
  e altera tudo, cancela qualquer um; exclusão definitiva só admin.
- `chamados.routes`: sem `solicitante`/`email` no corpo; `setor_id` no PATCH; **`POST /api/chamados/:id/cancelar`**; `DELETE` com
  `exigirPerfil(admin)`. `chamados.controller` passa `req.usuario` ao service.
- `cadastros`: `idPorNome` (provisório para achar o status "Cancelado").

**Frontend**
- `features/chamados/permissoes.js`: mesmas regras do backend para decidir os botões (editar, cancelar, excluir, status/setor).
- `ChamadoForm`: sem solicitante/e-mail; administrador também edita **status e setor**; dica "a equipe pode ajustar" na prioridade.
- `ChamadoModal`: "Abrir chamado"; botões por permissão — **Cancelar chamado** (com confirmação), **Excluir definitivamente** (ícone, só
  admin, com aviso para preferir cancelar), Editar; aviso ao solicitante quando o chamado já não está aberto.
- `ChamadoDetalhe`: solicitante, e-mail (link), setor.
- `ChamadosPage`: "Meus chamados" × "Chamados"; colunas **Setor** e solicitante só para o admin; textos por perfil.
- `InicioPage`: "Olá, Nome!"; resumo dos próprios chamados para o usuário comum.
- Menu lateral: "Meus chamados" (usuário) × "Chamados" (admin). Badge "Cancelado" em cinza.

**Docs:** `roadmap.md` (4.1 validada, 4.2 concluída), `decisoes.md` (6), `backlog.md` (B-02, B-03, B-04 resolvidos; B-27 novo), `SPEC.md`
(módulo e glossário), `modulos/chamados.md` (regras e perguntas respondidas), `backend/README.md`; R-004 validado.

## Decisões tomadas
- Chamado de outra pessoa responde **404** (não revela que existe).
- "Aberto" e "Cancelado" ainda reconhecidos pelo **nome** (backend e frontend) — vira marcador no cadastro de status na 4.3 (B-27).
- O administrador abre chamado em nome próprio (abrir "em nome de" outra pessoa não foi pedido).

## Ação necessária do dono
- [ ] **Executar** `database/migrations/002_chamado_com_dono.sql` e me avisar. Atenção: ela **remove** as colunas `solicitante` e `email`
  do chamado depois de copiar os dados para os usuários (a reversão está no cabeçalho).
- [ ] Reiniciar a API e testar:
  - como **admin**: menu "Chamados" mostra todos, com solicitante e setor; editar mostra status e setor; cancelar e excluir aparecem;
  - entrar como **joao@exemplo.com** / `Trocar@123` (troca a senha) → "Meus chamados" só com os dele; abrir um chamado (setor
    Secretaria automático); editar enquanto Aberto; cancelar;
  - como admin, pôr um chamado do João "Em atendimento" → como João, o botão Editar some e aparece o aviso;
  - como João, tentar abrir `http://localhost:5173/chamados?chamado=<id de outro>` → "Chamado não encontrado."
- [ ] Validar a 4.2 e autorizar a **4.3** (cadastros auxiliares: categorias, prioridades, status, setores — criar, editar, ativar/desativar;
  proposta de marcadores no status: inicial/encerra/cor/ordem e na prioridade: nível/cor/ordem — ver `modulos/cadastros.md`).

## Pendências / próximos passos
- 4.3 Cadastros auxiliares (resolve B-19, B-25, B-27).
- 4.5: decidir observações internas e reabertura.

## Verificação realizada
- `node --check` em todo o backend; `npm run build` do frontend — ok.
- Regras do service testadas com repositórios falsos em memória (sem banco): listas por perfil, 404 em chamado de outro, edição do usuário
  só no Aberto, 403 ao mudar status, criação com setor copiado, cancelar (aberto ok, repetido 400, em atendimento 403 para o usuário e ok
  para o admin) — todas como esperado.
- **Não testado:** a migração 002 (não executo SQL) e as telas com dados reais.
