-- =============================================================================
-- Migração:      002_chamado_com_dono
-- Título:        Chamado passa a pertencer a um usuário (solicitante) e a um setor; status "Cancelado"
-- Etapa / ref.:  4.2 Chamado com dono / R-005
-- Proposta em:   2026-11-11
-- Status:        Executada
-- Execução:      local: 2026-11-11 (dono) | produção: PENDENTE
-- Motivo:        O solicitante deixa de ser um texto digitado e passa a ser o usuário logado que abriu
--                o chamado (usuario_solicitante_id); o setor é copiado do usuário na abertura.
--                Quem desiste do chamado cancela (status "Cancelado") em vez de excluir.
--                Os solicitantes dos chamados existentes viram usuários comuns (senha temporária Trocar@123).
-- Reversão:      ALTER TABLE chamados ADD solicitante VARCHAR(120) NULL, ADD email VARCHAR(150) NULL;
--                UPDATE chamados c JOIN usuarios u ON u.id = c.usuario_solicitante_id SET c.solicitante = u.nome, c.email = u.email;
--                ALTER TABLE chamados DROP FOREIGN KEY fk_chamados_solicitante, DROP FOREIGN KEY fk_chamados_setor,
--                  DROP COLUMN usuario_solicitante_id, DROP COLUMN setor_id;
--                DELETE FROM status_chamados WHERE nome = 'Cancelado';  (só se nenhum chamado estiver cancelado)
--                (os usuários criados no passo 2 podem ficar ou ser desativados)
-- =============================================================================

USE helpdesk;

-- -----------------------------------------------------------------------------
-- 1. Novo status: "Cancelado" (quem abriu desistiu, ou o admin cancelou).
-- -----------------------------------------------------------------------------
INSERT INTO status_chamados (nome) VALUES ('Cancelado');

-- -----------------------------------------------------------------------------
-- 2. Cada e-mail que aparece nos chamados vira um usuário comum (se ainda não existir).
--    Inclui os 4 de teste (João, Mariana, Carlos, Ana) e os que você criou testando as fases 2 e 3.
--    Senha temporária: Trocar@123 (troca obrigatória no primeiro login). Mesmo hash da migração 001.
--    COLLATE: as tabelas antigas usam o padrão do servidor; as novas, utf8mb4_unicode_ci.
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (nome, email, senha_hash, perfil, trocar_senha)
SELECT
    MIN(c.solicitante),
    LOWER(TRIM(c.email)),
    '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.',
    'usuario',
    TRUE
FROM chamados c
WHERE c.email IS NOT NULL
  AND TRIM(c.email) <> ''
  AND LOWER(TRIM(c.email)) COLLATE utf8mb4_unicode_ci NOT IN (SELECT email FROM usuarios)
GROUP BY LOWER(TRIM(c.email));

-- Setor dos usuários de teste (para a visão do usuário comum ficar completa).
UPDATE usuarios SET setor_id = (SELECT id FROM setores WHERE nome = 'Secretaria')  WHERE email = 'joao@exemplo.com';
UPDATE usuarios SET setor_id = (SELECT id FROM setores WHERE nome = 'Biblioteca')  WHERE email = 'mariana@exemplo.com';
UPDATE usuarios SET setor_id = (SELECT id FROM setores WHERE nome = 'Coordenação') WHERE email = 'carlos@exemplo.com';
UPDATE usuarios SET setor_id = (SELECT id FROM setores WHERE nome = 'Financeiro')  WHERE email = 'ana@exemplo.com';

-- -----------------------------------------------------------------------------
-- 3. Novas colunas no chamado (primeiro aceitando vazio, para preencher os existentes).
-- -----------------------------------------------------------------------------
ALTER TABLE chamados
    ADD COLUMN usuario_solicitante_id INT UNSIGNED NULL AFTER descricao,
    ADD COLUMN setor_id INT UNSIGNED NULL AFTER usuario_solicitante_id;

-- 4. Liga cada chamado ao usuário do seu e-mail e copia o setor dele.
UPDATE chamados c
JOIN usuarios u ON u.email = LOWER(TRIM(c.email)) COLLATE utf8mb4_unicode_ci
SET c.usuario_solicitante_id = u.id,
    c.setor_id = u.setor_id;

-- Chamados sem e-mail ficam com o primeiro administrador.
UPDATE chamados
SET usuario_solicitante_id = (SELECT id FROM (SELECT id FROM usuarios WHERE perfil = 'admin' ORDER BY id LIMIT 1) AS admin)
WHERE usuario_solicitante_id IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Agora o solicitante é obrigatório; chaves e índices; saem as colunas de texto antigas
--    (nome e e-mail passam a vir do cadastro do usuário).
-- -----------------------------------------------------------------------------
ALTER TABLE chamados
    MODIFY usuario_solicitante_id INT UNSIGNED NOT NULL,
    ADD CONSTRAINT fk_chamados_solicitante FOREIGN KEY (usuario_solicitante_id) REFERENCES usuarios(id),
    ADD CONSTRAINT fk_chamados_setor FOREIGN KEY (setor_id) REFERENCES setores(id),
    DROP COLUMN solicitante,
    DROP COLUMN email;

CREATE INDEX idx_chamados_solicitante ON chamados(usuario_solicitante_id);
CREATE INDEX idx_chamados_setor ON chamados(setor_id);
