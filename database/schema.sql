-- =========================================================
-- BANCO DE DADOS
-- =========================================================
DROP DATABASE IF EXISTS helpdesk;
CREATE DATABASE helpdesk;
USE helpdesk;


-- =========================================================
-- TABELA: categorias
-- =========================================================
CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_categorias_nome UNIQUE (nome)
);

-- =========================================================
-- TABELA: prioridades
-- =========================================================
CREATE TABLE prioridades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(20) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_prioridades_nome UNIQUE (nome)
);

-- =========================================================
-- TABELA: status_chamados
-- =========================================================
CREATE TABLE status_chamados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_status_chamados_nome UNIQUE (nome)
);

-- =========================================================
-- TABELA: chamados
-- =========================================================
CREATE TABLE chamados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    solicitante VARCHAR(120) NOT NULL,
    email VARCHAR(150),
    categoria_id INT UNSIGNED NOT NULL,
    prioridade_id INT UNSIGNED NOT NULL,
    status_id INT UNSIGNED NOT NULL DEFAULT 1,
    data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chamados_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id),
    CONSTRAINT fk_chamados_prioridade
        FOREIGN KEY (prioridade_id)
        REFERENCES prioridades(id),
    CONSTRAINT fk_chamados_status
        FOREIGN KEY (status_id)
        REFERENCES status_chamados(id)
);

-- =========================================================
-- ÍNDICES
-- =========================================================
CREATE INDEX idx_chamados_categoria
ON chamados(categoria_id);

CREATE INDEX idx_chamados_prioridade
ON chamados(prioridade_id);

CREATE INDEX idx_chamados_status
ON chamados(status_id);

CREATE INDEX idx_chamados_data_abertura
ON chamados(data_abertura);

-- =========================================================
-- CATEGORIAS
-- =========================================================
INSERT INTO categorias (nome) VALUES
('Hardware'),
('Software'),
('Rede / Internet'),
('Acesso / Senha'),
('Outros');

-- =========================================================
-- PRIORIDADES
-- =========================================================
INSERT INTO prioridades (nome) VALUES
('Baixa'),
('Média'),
('Alta');

-- =========================================================
-- STATUS
-- =========================================================
INSERT INTO status_chamados (nome) VALUES
('Aberto'),
('Em atendimento'),
('Resolvido');

-- =========================================================
-- CHAMADOS PARA TESTE
-- =========================================================
INSERT INTO chamados (
    titulo,
    descricao,
    solicitante,
    email,
    categoria_id,
    prioridade_id,
    status_id
) VALUES
(
    'Computador não inicia',
    'O computador do setor administrativo não liga ao pressionar o botão de energia.',
    'João Silva',
    'joao@exemplo.com',
    1,
    3,
    1
),
(
    'Sem acesso à rede Wi-Fi',
    'O notebook conecta à rede Wi-Fi, mas não consegue acessar a internet.',
    'Mariana Costa',
    'mariana@exemplo.com',
    3,
    2,
    2
),
(
    'Erro ao acessar sistema acadêmico',
    'Ao realizar login, o sistema apresenta uma mensagem de erro.',
    'Carlos Oliveira',
    'carlos@exemplo.com',
    2,
    3,
    1
),
(
    'Impressora não imprime',
    'Os documentos permanecem parados na fila de impressão.',
    'Ana Souza',
    'ana@exemplo.com',
    1,
    1,
    3
);

-- =========================================================
-- CONSULTA PARA A API
-- =========================================================
SELECT
    c.id,
    c.titulo,
    c.descricao,
    c.solicitante,
    c.email,
    cat.nome AS categoria,
    p.nome AS prioridade,
    s.nome AS status,
    c.data_abertura,
    c.data_atualizacao
FROM chamados c
INNER JOIN categorias cat
    ON cat.id = c.categoria_id
INNER JOIN prioridades p
    ON p.id = c.prioridade_id
INNER JOIN status_chamados s
    ON s.id = c.status_id
ORDER BY c.id DESC;

-- =============================================================================
-- Migração:      001_usuarios_setores_sessoes
-- Título:        Cria setores, usuários (com perfil) e sessões de login; cadastra o primeiro administrador
-- Etapa / ref.:  4.1 Usuários e login / R-004
-- Proposta em:   2026-11-11
-- Status:        Proposta
-- Execução:      local: PENDENTE | produção: PENDENTE
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

-- =============================================================================
-- Migração:      002_chamado_com_dono
-- Título:        Chamado passa a pertencer a um usuário (solicitante) e a um setor; status "Cancelado"
-- Etapa / ref.:  4.2 Chamado com dono / R-005
-- Proposta em:   2026-11-11
-- Status:        Proposta
-- Execução:      local: PENDENTE | produção: PENDENTE
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


-- =============================================================================
-- Migração:      003_marcadores_status_prioridade
-- Título:        Status ganham tipo, "inicial", cor e ordem; prioridades ganham nível e cor
-- Etapa / ref.:  4.3 Cadastros auxiliares / R-006
-- Proposta em:   2026-11-11
-- Status:        Proposta
-- Execução:      local: PENDENTE | produção: PENDENTE
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


-- =============================================================================
-- Migração:      004_responsavel_e_historico
-- Título:        Responsável pelo atendimento, data de encerramento e histórico do chamado
-- Etapa / ref.:  4.5 Atendimento / R-009
-- Proposta em:   2026-11-11
-- Status:        Proposta
-- Execução:      local: PENDENTE | produção: PENDENTE
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
