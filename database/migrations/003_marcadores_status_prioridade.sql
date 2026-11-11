-- =============================================================================
-- Migração:      003_marcadores_status_prioridade
-- Título:        Status ganham tipo, "inicial", cor e ordem; prioridades ganham nível e cor
-- Etapa / ref.:  4.3 Cadastros auxiliares / R-006
-- Proposta em:   2026-11-11
-- Status:        Executada
-- Execução:      local: 2026-11-11 (dono) | produção: PENDENTE
-- Motivo:        O sistema deixa de reconhecer status e prioridades pelo NOME (B-19, B-25, B-27).
--                O administrador pode renomear ou criar status/prioridades que as regras continuam valendo:
--                  - tipo do status: aberto (o solicitante ainda pode editar/cancelar), andamento,
--                    resolvido, cancelado (usado pelo botão "Cancelar chamado"); resolvido/cancelado encerram;
--                  - inicial: o status com que todo chamado nasce (exatamente um, do tipo aberto);
--                  - cor: nome de cor do tema (neutro, primaria, info, sucesso, aviso, perigo) — funciona no claro e no escuro;
--                  - ordem: posição nas listas;
--                  - nível da prioridade: 1 = mais baixa; o maior nível é a "alta prioridade" do dashboard.
--                O status inicial passa a ser escolhido pela aplicação: sai o DEFAULT 1 de chamados.status_id.
-- Reversão:      ALTER TABLE chamados ALTER COLUMN status_id SET DEFAULT 1;
--                ALTER TABLE status_chamados DROP COLUMN tipo, DROP COLUMN inicial, DROP COLUMN cor, DROP COLUMN ordem;
--                ALTER TABLE prioridades DROP COLUMN nivel, DROP COLUMN cor;
-- =============================================================================

USE helpdesk;

-- -----------------------------------------------------------------------------
-- 1. Status
-- -----------------------------------------------------------------------------
ALTER TABLE status_chamados
    ADD COLUMN tipo ENUM('aberto', 'andamento', 'resolvido', 'cancelado') NOT NULL DEFAULT 'andamento' AFTER nome,
    ADD COLUMN inicial BOOLEAN NOT NULL DEFAULT FALSE AFTER tipo,
    ADD COLUMN cor VARCHAR(20) NOT NULL DEFAULT 'neutro' AFTER inicial,
    ADD COLUMN ordem INT NOT NULL DEFAULT 0 AFTER cor;

UPDATE status_chamados SET tipo = 'aberto',    inicial = TRUE, cor = 'info',    ordem = 1 WHERE nome = 'Aberto';
UPDATE status_chamados SET tipo = 'andamento',                 cor = 'aviso',   ordem = 2 WHERE nome = 'Em atendimento';
UPDATE status_chamados SET tipo = 'resolvido',                 cor = 'sucesso', ordem = 3 WHERE nome = 'Resolvido';
UPDATE status_chamados SET tipo = 'cancelado',                 cor = 'neutro',  ordem = 4 WHERE nome = 'Cancelado';

-- -----------------------------------------------------------------------------
-- 2. Prioridades
-- -----------------------------------------------------------------------------
ALTER TABLE prioridades
    ADD COLUMN nivel TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER nome,
    ADD COLUMN cor VARCHAR(20) NOT NULL DEFAULT 'neutro' AFTER nivel;

UPDATE prioridades SET nivel = 1, cor = 'neutro' WHERE nome = 'Baixa';
UPDATE prioridades SET nivel = 2, cor = 'aviso'  WHERE nome = 'Média';
UPDATE prioridades SET nivel = 3, cor = 'perigo' WHERE nome = 'Alta';

-- -----------------------------------------------------------------------------
-- 3. O status de um chamado novo vem do cadastro (status inicial), não mais do id 1.
-- -----------------------------------------------------------------------------
ALTER TABLE chamados ALTER COLUMN status_id DROP DEFAULT;

-- Conferência (opcional): deve mostrar exatamente 1 linha.
-- SELECT id, nome FROM status_chamados WHERE inicial = TRUE;
