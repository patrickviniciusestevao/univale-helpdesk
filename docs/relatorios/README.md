# Relatórios de Desenvolvimento

Um relatório por prompt que altera o projeto. Garante rastreabilidade: o que foi pedido, o que foi feito,
o que ficou pendente e o que precisa de ação do dono.

## Convenção de nome
`R-NNN_AAAA-MM-DD_titulo-curto.md` — numeração sequencial, nunca reutilizada.

## Índice

| ID | Data | Fase | Título | Commit |
|---|---|---|---|---|
| [R-000](R-000_2026-11-11_analise-inicial.md) | 2026-11-11 | — | Análise inicial do projeto | — |
| [R-001](R-001_2026-11-11_harness-e-documentacao.md) | 2026-11-11 | 0 e 1 | Harness e documentação inicial | — |
| [R-002](R-002_2026-11-11_backend-por-modulos.md) | 2026-11-11 | 2 | Backend por módulos e padrões | — |
| [R-003](R-003_2026-11-11_frontend-react.md) | 2026-11-11 | 3 | Frontend React + Vite + Tailwind | — |
| [R-004](R-004_2026-11-11_usuarios-e-login.md) | 2026-11-11 | 4.1 | Usuários e login | — |
| [R-005](R-005_2026-11-11_chamado-com-dono.md) | 2026-11-11 | 4.2 | Chamado com dono | — |
| [R-006](R-006_2026-11-11_cadastros-auxiliares.md) | 2026-11-11 | 4.3 | Cadastros auxiliares | — |
| [R-007](R-007_2026-11-11_gestao-de-usuarios.md) | 2026-11-11 | 4.4 | Gestão de usuários | — |
| [R-008](R-008_2026-11-11_jwt-secret-no-env.md) | 2026-11-11 | 4.4 | JWT_SECRET no .env local | — |
| [R-009](R-009_2026-11-11_atendimento-e-historico.md) | 2026-11-11 | 4.5 | Atendimento: responsável, observações e histórico | — |
| [R-010](R-010_2026-11-11_dashboard-e-filtros.md) | 2026-11-11 | 4.6 | Dashboard e filtros | — |
| [R-011](R-011_2026-11-11_seguranca-e-schema-completo.md) | 2026-11-11 | 5.1 | Pré-deploy: segurança e script SQL completo | — |
| [R-012](R-012_2026-11-11_encerramento.md) | 2026-11-11 | — | Encerramento do projeto | — |
| [R-013](R-013_2026-11-11_git-e-github-publico.md) | 2026-11-11 | 0 | Versionamento com git para o GitHub público da aula | primeiro commit |

## Modelo

```markdown
# R-NNN — <Título>

| Campo | Valor |
|---|---|
| Data | AAAA-MM-DD |
| Fase / etapa | <n> — <nome> |
| Branch / commit | sem git (ou <branch> / <hash>) |
| Status | Concluído — aguardando validação |

## Pedido
<resumo do que o dono pediu neste prompt>

## O que foi feito
- <mudança> — `caminho/arquivo`

## Decisões tomadas
- <decisão e motivo> (registrar em docs/decisoes.md se for relevante)

## Ação necessária do dono
- [ ] <ex.: executar a migração NNN / validar a etapa>

## Pendências / próximos passos
- <o que fica para a próxima etapa>

## Verificação realizada
- <checagem mínima feita (build, require) — ou "nenhuma"> e o que não foi testado
```

## Modelo do R-000 (análise inicial — sem alterar código)

```markdown
# R-000 — Análise inicial do projeto

| Campo | Valor |
|---|---|
| Data | AAAA-MM-DD |
| Fase / etapa | — (diagnóstico, sem alterações) |
| Branch / commit | <branch> / <hash do estado analisado> |
| Status | Concluído |

## Pedido
<ex.: revisar o projeto iniciado com outra IA e alinhar ao padrão do harness>

## Documentação recebida
- `docs/legado/<arquivo>` — <técnica / não técnica> — <o que cobre>

## Resultado
- **Arquitetura real:** <camadas, pastas, stack>
- **Estado:** <compila? sobe? o que não foi commitado>
- **Documentação × código:** <o que bate, o que diverge — itens B-NN>
- **Bugs funcionais:** B-01 a B-NN em [backlog](../backlog.md). Mais grave: <...>
- **Segurança:** <resumo> → [seguranca.md](../seguranca.md)
- **Padronização:** <estilos misturados, duplicações, componentes>

## Perguntas em aberto
- [ ] <dúvida de regra de negócio — o dono decide>

## Proposta de fases
<tabela resumida; detalhe em docs/roadmap.md>

## Ação necessária do dono
- [ ] Responder as perguntas e validar as fases.
```
