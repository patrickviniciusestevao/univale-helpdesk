-- =============================================================================
-- Univale Helpdesk — SCHEMA COMPLETO (estado atual, sem ALTER)
-- -----------------------------------------------------------------------------
-- Equivale a: database/schema.sql (script da aula) + migrações 001, 002, 003 e 004,
-- já consolidadas — cada tabela é criada direto no formato final.
--
-- Gerado em:   2026-11-11 (etapa 5.1, R-011)
-- Uso:         instalação NOVA (computador de aluno, servidor novo). Para um banco que já existe,
--              continue usando as migrações em database/migrations/ (este arquivo não altera nada existente).
-- Segurança:   NÃO há "DROP DATABASE". Se o banco "helpdesk" já tiver tabelas, o script para com erro
--              na primeira CREATE TABLE em vez de apagar dados. Para recriar do zero, apague o banco
--              manualmente antes (DROP DATABASE helpdesk;) — e só se tiver certeza.
-- Conteúdo:    1. banco · 2. tabelas · 3. dados iniciais (obrigatórios) · 4. dados de exemplo (opcional)
--              · 5. usuário do aplicativo com permissões mínimas (opcional, recomendado em produção)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS helpdesk
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE helpdesk;


-- =============================================================================
-- 2. TABELAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- setores — área da instituição (Financeiro, Secretaria...). Desativa-se, não se apaga.
-- -----------------------------------------------------------------------------
CREATE TABLE setores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_setores_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- usuarios — quem acessa o sistema. A senha NUNCA é guardada: só o hash bcrypt.
--   perfil:       usuario (abre e acompanha os próprios chamados) | admin (gerencia tudo)
--   trocar_senha: TRUE = senha temporária, troca obrigatória no próximo login
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
-- sessoes — sessões de login (refresh token). Guarda só o hash SHA-256 do token.
--   revogado_em preenchido = sessão encerrada (sair, renovação, senha redefinida, usuário desativado)
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
-- categorias — tipo do problema (Hardware, Software...).
-- -----------------------------------------------------------------------------
CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_categorias_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- prioridades — urgência do chamado.
--   nivel: 1 = mais baixa; o maior nível (entre as ativas) é a "alta prioridade" do dashboard
--   cor:   nome de cor do tema (neutro, primaria, info, sucesso, aviso, perigo)
-- -----------------------------------------------------------------------------
CREATE TABLE prioridades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(20) NOT NULL,
    nivel TINYINT UNSIGNED NOT NULL DEFAULT 1,
    cor VARCHAR(20) NOT NULL DEFAULT 'neutro',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_prioridades_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- status_chamados — etapas do atendimento.
--   tipo:    aberto (solicitante ainda pode editar/cancelar) | andamento | resolvido | cancelado
--            resolvido e cancelado ENCERRAM o chamado; o botão "Cancelar" usa o 1º status ativo do tipo cancelado
--   inicial: status com que todo chamado nasce — exatamente UM, ativo e do tipo aberto (regra da aplicação)
--   cor / ordem: cor da etiqueta e posição nas listas
-- -----------------------------------------------------------------------------
CREATE TABLE status_chamados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    tipo ENUM('aberto', 'andamento', 'resolvido', 'cancelado') NOT NULL DEFAULT 'andamento',
    inicial BOOLEAN NOT NULL DEFAULT FALSE,
    cor VARCHAR(20) NOT NULL DEFAULT 'neutro',
    ordem INT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_status_chamados_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- chamados — "João abriu o chamado. Patrick está atendendo."
--   usuario_solicitante_id: quem abriu (obrigatório)
--   usuario_responsavel_id: administrador que atende (vazio = ninguém assumiu)
--   setor_id:               copiado do solicitante na abertura
--   status_id:              sem valor padrão — a aplicação usa o status marcado como inicial
--   data_encerramento:      preenchida ao resolver/cancelar; limpa ao reabrir
-- -----------------------------------------------------------------------------
CREATE TABLE chamados (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    usuario_solicitante_id INT UNSIGNED NOT NULL,
    usuario_responsavel_id INT UNSIGNED NULL,
    setor_id INT UNSIGNED NULL,
    categoria_id INT UNSIGNED NOT NULL,
    prioridade_id INT UNSIGNED NOT NULL,
    status_id INT UNSIGNED NOT NULL,
    data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_encerramento DATETIME NULL,
    CONSTRAINT fk_chamados_solicitante FOREIGN KEY (usuario_solicitante_id) REFERENCES usuarios(id),
    CONSTRAINT fk_chamados_responsavel FOREIGN KEY (usuario_responsavel_id) REFERENCES usuarios(id),
    CONSTRAINT fk_chamados_setor FOREIGN KEY (setor_id) REFERENCES setores(id),
    CONSTRAINT fk_chamados_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT fk_chamados_prioridade FOREIGN KEY (prioridade_id) REFERENCES prioridades(id),
    CONSTRAINT fk_chamados_status FOREIGN KEY (status_id) REFERENCES status_chamados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_chamados_solicitante ON chamados(usuario_solicitante_id);
CREATE INDEX idx_chamados_responsavel ON chamados(usuario_responsavel_id);
CREATE INDEX idx_chamados_setor ON chamados(setor_id);
CREATE INDEX idx_chamados_categoria ON chamados(categoria_id);
CREATE INDEX idx_chamados_prioridade ON chamados(prioridade_id);
CREATE INDEX idx_chamados_status ON chamados(status_id);
CREATE INDEX idx_chamados_data_abertura ON chamados(data_abertura);

-- -----------------------------------------------------------------------------
-- chamado_historico — linha do tempo do chamado.
--   tipo:     abertura | edicao | status | prioridade | responsavel | observacao | reabertura
--   valores como TEXTO (ex.: "Aberto" → "Em atendimento"): mostram o que era na época
--   interna:  observação que só a equipe (administradores) vê
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


-- =============================================================================
-- 3. DADOS INICIAIS (obrigatórios — o sistema precisa deles para funcionar)
-- =============================================================================

INSERT INTO setores (nome) VALUES
('Financeiro'),
('Secretaria'),
('Biblioteca'),
('Laboratório'),
('Coordenação'),
('TI');

INSERT INTO categorias (nome) VALUES
('Hardware'),
('Software'),
('Rede / Internet'),
('Acesso / Senha'),
('Outros');

INSERT INTO prioridades (nome, nivel, cor) VALUES
('Baixa', 1, 'neutro'),
('Média', 2, 'aviso'),
('Alta',  3, 'perigo');

INSERT INTO status_chamados (nome, tipo, inicial, cor, ordem) VALUES
('Aberto',         'aberto',    TRUE,  'info',    1),
('Em atendimento', 'andamento', FALSE, 'aviso',   2),
('Resolvido',      'resolvido', FALSE, 'sucesso', 3),
('Cancelado',      'cancelado', FALSE, 'neutro',  4);

-- Primeiro administrador.
--   E-mail: admin@helpdesk.local · Senha temporária: Trocar@123 (troca obrigatória no primeiro login)
--   Em produção, troque o e-mail aqui antes de executar e entre logo em seguida para criar a senha.
INSERT INTO usuarios (nome, email, senha_hash, perfil, setor_id, trocar_senha) VALUES
('Administrador', 'admin@helpdesk.local', '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.', 'admin',
 (SELECT id FROM setores WHERE nome = 'TI'), TRUE);


-- =============================================================================
-- 4. DADOS DE EXEMPLO (OPCIONAL — para aula e testes; NÃO execute em produção)
--    Usuários comuns com senha temporária Trocar@123 e 4 chamados com o histórico de abertura.
-- =============================================================================

INSERT INTO usuarios (nome, email, senha_hash, perfil, setor_id, trocar_senha) VALUES
('João Silva',      'joao@exemplo.com',    '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.', 'usuario', (SELECT id FROM setores WHERE nome = 'Secretaria'),  TRUE),
('Mariana Costa',   'mariana@exemplo.com', '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.', 'usuario', (SELECT id FROM setores WHERE nome = 'Biblioteca'),  TRUE),
('Carlos Oliveira', 'carlos@exemplo.com',  '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.', 'usuario', (SELECT id FROM setores WHERE nome = 'Coordenação'), TRUE),
('Ana Souza',       'ana@exemplo.com',     '$2a$10$HL3Trqy86veuZdAAaRbikOnDAX2b41.YzFUnAFPiRxXq3TZrvF5T.', 'usuario', (SELECT id FROM setores WHERE nome = 'Financeiro'),  TRUE);

INSERT INTO chamados (titulo, descricao, usuario_solicitante_id, setor_id, categoria_id, prioridade_id, status_id, data_encerramento)
SELECT d.titulo, d.descricao, u.id, u.setor_id, cat.id, p.id, s.id,
       CASE WHEN s.tipo IN ('resolvido', 'cancelado') THEN NOW() ELSE NULL END
FROM (
    SELECT 'Computador não inicia' AS titulo,
           'O computador do setor administrativo não liga ao pressionar o botão de energia.' AS descricao,
           'joao@exemplo.com' AS email, 'Hardware' AS categoria, 'Alta' AS prioridade, 'Aberto' AS status
    UNION ALL SELECT 'Sem acesso à rede Wi-Fi', 'O notebook conecta à rede Wi-Fi, mas não consegue acessar a internet.',
           'mariana@exemplo.com', 'Rede / Internet', 'Média', 'Em atendimento'
    UNION ALL SELECT 'Erro ao acessar sistema acadêmico', 'Ao realizar login, o sistema apresenta uma mensagem de erro.',
           'carlos@exemplo.com', 'Software', 'Alta', 'Aberto'
    UNION ALL SELECT 'Impressora não imprime', 'Os documentos permanecem parados na fila de impressão.',
           'ana@exemplo.com', 'Hardware', 'Baixa', 'Resolvido'
) AS d
JOIN usuarios u ON u.email = d.email
JOIN categorias cat ON cat.nome = d.categoria
JOIN prioridades p ON p.nome = d.prioridade
JOIN status_chamados s ON s.nome = d.status;

-- Linha de abertura no histórico de cada chamado de exemplo.
INSERT INTO chamado_historico (chamado_id, usuario_id, tipo, valor_novo, criado_em)
SELECT c.id, c.usuario_solicitante_id, 'abertura', 'Aberto', c.data_abertura
FROM chamados c;


-- =============================================================================
-- 5. USUÁRIO DO APLICATIVO (OPCIONAL — recomendado em produção)
--    O backend não deve conectar como "root". Este usuário só lê e grava dados nas tabelas do
--    helpdesk; não cria, altera nem apaga tabelas. Troque a senha e use os mesmos valores em
--    DB_USER / DB_PASSWORD no backend/.env. Descomente para usar.
-- =============================================================================

-- CREATE USER 'helpdesk_app'@'localhost' IDENTIFIED BY 'TROQUE-POR-UMA-SENHA-FORTE';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON helpdesk.* TO 'helpdesk_app'@'localhost';
-- FLUSH PRIVILEGES;
