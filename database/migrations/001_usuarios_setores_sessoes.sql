-- =============================================================================
-- Migração:      001_usuarios_setores_sessoes
-- Título:        Cria setores, usuários (com perfil) e sessões de login; cadastra o primeiro administrador
-- Etapa / ref.:  4.1 Usuários e login / R-004
-- Proposta em:   2026-11-11
-- Status:        Executada
-- Execução:      local: 2026-11-11 (dono) | produção: PENDENTE
-- Motivo:        Login com e-mail e senha (bcrypt), perfis "usuario" e "admin", setor do usuário e
--                sessões para o refresh token (permite "sair" de verdade e encerrar sessões).
-- Reversão:      DROP TABLE sessoes; DROP TABLE usuarios; DROP TABLE setores;
-- =============================================================================

USE helpdesk;

-- -----------------------------------------------------------------------------
-- Setores: área da instituição (Financeiro, Secretaria...). Desativa-se, não se apaga.
-- -----------------------------------------------------------------------------
CREATE TABLE setores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_setores_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO setores (nome) VALUES
('Financeiro'),
('Secretaria'),
('Biblioteca'),
('Laboratório'),
('Coordenação'),
('TI');

-- -----------------------------------------------------------------------------
-- Usuários. A senha NUNCA é guardada: só o hash bcrypt (60 caracteres).
-- trocar_senha = 1 obriga a trocar no próximo login (usuário criado pelo admin).
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(100) NOT NULL,
    perfil ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    setor_id INT UNSIGNED NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    trocar_senha BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acesso DATETIME NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuarios_email UNIQUE (email),
    CONSTRAINT fk_usuarios_setor FOREIGN KEY (setor_id) REFERENCES setores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_usuarios_setor ON usuarios(setor_id);

-- -----------------------------------------------------------------------------
-- Sessões de login (refresh token). Guarda só o hash SHA-256 do token, nunca o token.
-- revogado_em preenchido = sessão encerrada (sair, troca de token).
-- -----------------------------------------------------------------------------
CREATE TABLE sessoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    user_agent VARCHAR(255) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    revogado_em DATETIME NULL,
    CONSTRAINT uk_sessoes_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sessoes_usuario ON sessoes(usuario_id);

-- -----------------------------------------------------------------------------
-- Primeiro administrador.
--   E-mail: admin@helpdesk.local
--   Senha temporária: Trocar@123  (o sistema obriga a trocar no primeiro login)
-- Pode trocar o nome/e-mail aqui antes de executar. O hash abaixo é o bcrypt de "Trocar@123".
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (nome, email, senha_hash, perfil, setor_id, trocar_senha)
VALUES (
    'Administrador',
    'admin@helpdesk.local',
    '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.',
    'admin',
    (SELECT id FROM setores WHERE nome = 'TI'),
    TRUE
);
