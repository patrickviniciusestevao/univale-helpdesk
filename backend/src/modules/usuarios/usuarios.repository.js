const { pool } = require("../../config/db");

// senha_hash nunca sai daqui, exceto em buscarParaLogin/buscarSenhaHash (usados só pelo auth).
const SELECT_USUARIO = `
  SELECT
    u.id, u.nome, u.email, u.perfil, u.setor_id, s.nome AS setor,
    u.ativo, u.trocar_senha, u.ultimo_acesso, u.criado_em
  FROM usuarios u
  LEFT JOIN setores s ON s.id = u.setor_id
`;

async function listar() {
  const [linhas] = await pool.query(`${SELECT_USUARIO} ORDER BY u.nome`);
  return linhas;
}

async function buscarPorId(id) {
  const [linhas] = await pool.query(`${SELECT_USUARIO} WHERE u.id = ? LIMIT 1`, [id]);
  return linhas[0] || null;
}

async function buscarIdPorEmail(email) {
  const [linhas] = await pool.query("SELECT id FROM usuarios WHERE email = ? LIMIT 1", [email]);
  return linhas[0]?.id ?? null;
}

async function buscarParaLogin(email) {
  const [linhas] = await pool.query(
    `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.trocar_senha, u.senha_hash FROM usuarios u WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return linhas[0] || null;
}

async function buscarSenhaHash(id) {
  const [linhas] = await pool.query("SELECT senha_hash FROM usuarios WHERE id = ? LIMIT 1", [id]);
  return linhas[0]?.senha_hash ?? null;
}

// Usuário novo sempre nasce com senha temporária (trocar_senha = TRUE, padrão da tabela).
async function inserir({ nome, email, perfil, setor_id, senha_hash }) {
  const [resultado] = await pool.query(
    "INSERT INTO usuarios (nome, email, perfil, setor_id, senha_hash, trocar_senha) VALUES (?, ?, ?, ?, ?, TRUE)",
    [nome, email, perfil, setor_id ?? null, senha_hash]
  );
  return resultado.insertId;
}

async function atualizar(id, { nome, email, perfil, setor_id, ativo }) {
  await pool.query("UPDATE usuarios SET nome = ?, email = ?, perfil = ?, setor_id = ?, ativo = ? WHERE id = ?", [
    nome,
    email,
    perfil,
    setor_id ?? null,
    ativo,
    id
  ]);
}

// Troca feita pelo próprio usuário: a senha passa a ser definitiva.
async function atualizarSenha(id, senhaHash) {
  await pool.query("UPDATE usuarios SET senha_hash = ?, trocar_senha = FALSE WHERE id = ?", [senhaHash, id]);
}

// Redefinição feita pelo administrador: senha temporária, troca obrigatória no próximo login.
async function definirSenhaTemporaria(id, senhaHash) {
  await pool.query("UPDATE usuarios SET senha_hash = ?, trocar_senha = TRUE WHERE id = ?", [senhaHash, id]);
}

async function contarAdminsAtivos() {
  const [linhas] = await pool.query("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'admin' AND ativo = 1");
  return Number(linhas[0].total);
}

async function registrarAcesso(id) {
  await pool.query("UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?", [id]);
}

module.exports = {
  listar,
  buscarPorId,
  buscarIdPorEmail,
  buscarParaLogin,
  buscarSenhaHash,
  inserir,
  atualizar,
  atualizarSenha,
  definirSenhaTemporaria,
  contarAdminsAtivos,
  registrarAcesso
};
