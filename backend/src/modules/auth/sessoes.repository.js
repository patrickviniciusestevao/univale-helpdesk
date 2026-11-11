const { pool } = require("../../config/db");

async function criar({ usuario_id, token_hash, user_agent, expira_em }) {
  await pool.query("INSERT INTO sessoes (usuario_id, token_hash, user_agent, expira_em) VALUES (?, ?, ?, ?)", [
    usuario_id,
    token_hash,
    user_agent,
    expira_em
  ]);
}

// Sessão válida = existe, não foi encerrada e não venceu.
async function buscarValidaPorHash(tokenHash) {
  const [linhas] = await pool.query(
    "SELECT id, usuario_id FROM sessoes WHERE token_hash = ? AND revogado_em IS NULL AND expira_em > NOW() LIMIT 1",
    [tokenHash]
  );
  return linhas[0] || null;
}

async function revogar(id) {
  await pool.query("UPDATE sessoes SET revogado_em = NOW() WHERE id = ? AND revogado_em IS NULL", [id]);
}

async function revogarPorHash(tokenHash) {
  await pool.query("UPDATE sessoes SET revogado_em = NOW() WHERE token_hash = ? AND revogado_em IS NULL", [tokenHash]);
}

// Encerra todas as sessões de um usuário (desativado ou senha redefinida): ele precisa entrar de novo.
async function revogarTodasDoUsuario(usuarioId) {
  await pool.query("UPDATE sessoes SET revogado_em = NOW() WHERE usuario_id = ? AND revogado_em IS NULL", [usuarioId]);
}

/**
 * Faxina: apaga sessões encerradas ou vencidas há mais de "dias" dias (a tabela não cresce para sempre).
 * As recentes ficam por um tempo, para consulta em caso de problema.
 */
async function apagarAntigas(dias = 30) {
  const [resultado] = await pool.query(
    `DELETE FROM sessoes
      WHERE (revogado_em IS NOT NULL AND revogado_em < NOW() - INTERVAL ? DAY)
         OR expira_em < NOW() - INTERVAL ? DAY`,
    [dias, dias]
  );
  return resultado.affectedRows;
}

module.exports = { apagarAntigas, criar, buscarValidaPorHash, revogar, revogarPorHash, revogarTodasDoUsuario };
