---
name: nova-migracao
description: Cria a proposta de uma mudança no banco de dados do projeto Univale Helpdesk como arquivo database/migrations/NNN_descricao.sql com o cabeçalho padrão e atualiza o índice em database/README.md. Use sempre que o código precisar de tabela, coluna, índice ou dado novo no MySQL. Nunca executa SQL.
---

# Nova migração (proposta) — Univale Helpdesk

O banco é do dono (HARNESS.md, regra 1): **o agente só escreve a proposta; quem executa é o dono.** Nunca rode SQL,
cliente MySQL, script de carga ou migration.

## Passos
1. Descubra o próximo número: maior `NNN` em `database/migrations/` + 1 (três dígitos; nunca reutilize número).
2. Confira o schema atual em `database/schema.sql` (só leitura) para nomes exatos de tabelas/colunas, tipos e posição (`AFTER`).
3. Crie `database/migrations/NNN_descricao_curta.sql` (snake_case, em português) começando **exatamente** com:

```sql
-- =============================================================================
-- Migração:      NNN_descricao_curta
-- Título:        <o que muda, em uma linha>
-- Etapa / ref.:  <etapa de docs/roadmap.md> / <relatório R-NNN desta etapa>
-- Proposta em:   AAAA-MM-DD
-- Status:        Proposta
-- Execução:      local: PENDENTE | produção: PENDENTE
-- Motivo:        <por que o código precisa disso; regra de negócio envolvida>
-- Reversão:      <SQL para desfazer, ou "não reversível" e por quê>
-- =============================================================================
```

4. Depois do cabeçalho, o SQL: comentários curtos em português explicando o "porquê"; `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
   COLLATE=utf8mb4_unicode_ci` em tabela nova; chaves e índices nomeados (`idx_<tabela>_<coluna>`, `fk_<tabela>_<referência>`);
   domínio do negócio em português, espelho de sistema externo com os nomes da API dele. Dados iniciais opcionais vão num bloco separado e comentado como opcional.
5. Acrescente a linha no índice de `database/README.md`: `| NNN | [arquivo](migrations/arquivo) | — | Título | Etapa | Proposta | Pendente | Pendente |`.
6. Reflita a mudança em `database/schema_completo.sql` (o estado final, sem ALTER) — ele precisa sempre criar o banco igual ao de quem executou todas as migrações.
7. Cite a migração no relatório da etapa e avise o dono, em linguagem simples, o que ela faz e que precisa ser executada antes de testar.

## Quando o dono informar que executou
Atualize no arquivo `Status: Executada` e `Execução: local AAAA-MM-DD HH:MM (quem) | produção: PENDENTE`, e a linha do índice.
Não altere o SQL de uma migração já executada — correção vira nova migração.
