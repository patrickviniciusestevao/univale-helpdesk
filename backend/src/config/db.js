const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testarConexao() {
  await pool.query("SELECT 1");
}

/**
 * Executa várias operações numa transação: ou todas gravam, ou nenhuma.
 * Uso: await withTransaction(async (conn) => { await conn.query(...); ... })
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

module.exports = { pool, testarConexao, withTransaction };
