-- =============================================================================
-- Migração:      004_responsavel_e_historico
-- Título:        Responsável pelo atendimento, data de encerramento e histórico do chamado
-- Etapa / ref.:  4.5 Atendimento / R-009
-- Proposta em:   2026-11-11
-- Status:        Executada
-- Execução:      local: 2026-11-11 (dono) | produção: PENDENTE
-- Motivo:        "João abriu o chamado. Patrick está atendendo." — o chamado passa a ter um responsável
--                (administrador). Toda mudança (status, prioridade, responsável, edição), cada observação
--                e cada reabertura vira uma linha no histórico, com quem fez e quando.
--                data_encerramento: quando o chamado foi resolvido/cancelado (prazo de reabertura e,
--                no futuro, tempo de atendimento).
-- Reversão:      DROP TABLE chamado_historico;
--                ALTER TABLE chamados DROP FOREIGN KEY fk_chamados_responsavel,
--                  DROP COLUMN usuario_responsavel_id, DROP COLUMN data_encerramento;
-- =============================================================================

USE helpdesk;

-- -----------------------------------------------------------------------------
-- 1. Responsável e data de encerramento no chamado.
-- -----------------------------------------------------------------------------
ALTER TABLE chamados
    ADD COLUMN usuario_responsavel_id INT UNSIGNED NULL AFTER usuario_solicitante_id,
    ADD COLUMN data_encerramento DATETIME NULL AFTER data_atualizacao,
    ADD CONSTRAINT fk_chamados_responsavel FOREIGN KEY (usuario_responsavel_id) REFERENCES usuarios(id);

CREATE INDEX idx_chamados_responsavel ON chamados(usuario_responsavel_id);

-- Chamados já encerrados: usa a última atualização como data de encerramento.
UPDATE chamados c
JOIN status_chamados s ON s.id = c.status_id
SET c.data_encerramento = c.data_atualizacao
WHERE s.tipo IN ('resolvido', 'cancelado');

-- -----------------------------------------------------------------------------
-- 2. Histórico do chamado (linha do tempo).
--    Os valores ficam como TEXTO (ex.: "Aberto" → "Em atendimento"): o histórico mostra o que era
--    na época, mesmo que o cadastro seja renomeado depois.
--    interna = observação que só a equipe (administradores) vê.
-- -----------------------------------------------------------------------------
CREATE TABLE chamado_historico (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    tipo ENUM('abertura', 'edicao', 'status', 'prioridade', 'responsavel', 'observacao', 'reabertura') NOT NULL,
    valor_anterior VARCHAR(255) NULL,
    valor_novo VARCHAR(255) NULL,
    texto TEXT NULL,
    interna BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_chamado FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_historico_chamado ON chamado_historico(chamado_id, criado_em);

-- Chamados existentes ganham a linha de abertura (feita pelo solicitante, na data de abertura).
INSERT INTO chamado_historico (chamado_id, usuario_id, tipo, valor_novo, criado_em)
SELECT c.id, c.usuario_solicitante_id, 'abertura', s.nome, c.data_abertura
FROM chamados c
JOIN status_chamados s ON s.id = c.status_id;
