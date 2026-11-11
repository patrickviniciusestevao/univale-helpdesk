const { pool } = require("../../config/db");

// "config" é um item de cadastros.tipos.js (tabela e colunas de uma lista fixa).
// "conn" permite rodar dentro de uma transação (withTransaction); sem ela, usa o pool.

async function listar(config, { somenteAtivos }) {
  const filtro = somenteAtivos ? "WHERE ativo = 1" : "";
  const [linhas] = await pool.query(`SELECT ${config.colunas.join(", ")} FROM ${config.tabela} ${filtro} ORDER BY ${config.ordenacao}`);
  return linhas;
}

async function buscarPorId(config, id) {
  const [linhas] = await pool.query(`SELECT ${config.colunas.join(", ")} FROM ${config.tabela} WHERE id = ? LIMIT 1`, [id]);
  return linhas[0] || null;
}

// Só grava colunas que existem na configuração do tipo.
function colunasGravaveis(config, dados) {
  return Object.keys(dados).filter((c) => c !== "id" && config.colunas.includes(c) && dados[c] !== undefined);
}

async function inserir(config, dados, conn = pool) {
  const colunas = colunasGravaveis(config, dados);
  const [resultado] = await conn.query(
    `INSERT INTO ${config.tabela} (${colunas.join(", ")}) VALUES (${colunas.map(() => "?").join(", ")})`,
    colunas.map((c) => dados[c])
  );
  return resultado.insertId;
}

async function atualizar(config, id, dados, conn = pool) {
  const colunas = colunasGravaveis(config, dados);
  if (colunas.length === 0) return;
  await conn.query(`UPDATE ${config.tabela} SET ${colunas.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [
    ...colunas.map((c) => dados[c]),
    id
  ]);
}

// --- Específicos de status ---

// Só um status pode ser o inicial: antes de marcar um, desmarca os outros.
async function desmarcarStatusInicial(conn = pool) {
  await conn.query("UPDATE status_chamados SET inicial = FALSE WHERE inicial = TRUE");
}

async function buscarStatusInicial() {
  const [linhas] = await pool.query("SELECT id FROM status_chamados WHERE inicial = TRUE AND ativo = 1 LIMIT 1");
  return linhas[0] || null;
}

async function buscarPrimeiroStatusDoTipo(tipo) {
  const [linhas] = await pool.query("SELECT id FROM status_chamados WHERE tipo = ? AND ativo = 1 ORDER BY ordem, id LIMIT 1", [tipo]);
  return linhas[0] || null;
}

module.exports = { listar, buscarPorId, inserir, atualizar, desmarcarStatusInicial, buscarStatusInicial, buscarPrimeiroStatusDoTipo };
