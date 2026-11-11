# Banco de dados — migrações

> O agente de IA **não executa nada no banco** (HARNESS.md, regra 1). Toda mudança de schema ou de dados é proposta como
> **um arquivo de migração** em `migrations/`, revisada e executada **pelo dono**, que registra a execução no cabeçalho do arquivo
> e na tabela abaixo.

- `schema.sql` — script de referência do dono (antes `db_helpdesk.sql`, o script da aula): cria o banco `helpdesk`, as tabelas
  `categorias`, `prioridades`, `status_chamados`, `chamados`, os dados iniciais e 4 chamados de teste. **Atenção: começa com
  `DROP DATABASE IF EXISTS helpdesk`** — rodá-lo apaga o banco inteiro (B-17). As migrações executadas devem ser acrescentadas
  ao fim dele pelo dono. **Sem senhas.**
- `schema_completo.sql` — **instalação nova**: cria o banco já no formato atual (equivale a `schema.sql` + migrações 001–004), sem
  `ALTER` e **sem `DROP DATABASE`** (se o banco já tiver tabelas, para com erro em vez de apagar). Inclui dados iniciais obrigatórios,
  dados de exemplo opcionais e o usuário do app com permissões mínimas (comentado). **Toda nova migração deve ser refletida nele.**
- `migrations/NNN_descricao.sql` — uma mudança por arquivo, em ordem. Os números nunca são reutilizados. Banco que já existe: só migrações.

## Índice

| Nº | Arquivo | Título | Etapa | Status | Local | Produção |
|---|---|---|---|---|---|---|
| 001 | [001_usuarios_setores_sessoes.sql](migrations/001_usuarios_setores_sessoes.sql) | Setores, usuários, sessões e primeiro administrador | 4.1 | Executada | 2026-11-11 | Pendente |
| 002 | [002_chamado_com_dono.sql](migrations/002_chamado_com_dono.sql) | Chamado com solicitante (usuário) e setor; status Cancelado; solicitantes antigos viram usuários | 4.2 | Executada | 2026-11-11 | Pendente |
| 003 | [003_marcadores_status_prioridade.sql](migrations/003_marcadores_status_prioridade.sql) | Status com tipo, inicial, cor e ordem; prioridades com nível e cor | 4.3 | Executada | 2026-11-11 | Pendente |
| 004 | [004_responsavel_e_historico.sql](migrations/004_responsavel_e_historico.sql) | Responsável, data de encerramento e histórico do chamado | 4.5 | Executada | 2026-11-11 | Pendente |
