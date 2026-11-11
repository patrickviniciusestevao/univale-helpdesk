const { pool } = require("../../config/db");
const { FROM_CHAMADO, montarFiltro } = require("../chamados/chamados.repository");

// Contas do dashboard. Os filtros são os mesmos da lista de chamados (montarFiltro),
// assim "Alta prioridade: 3" no card é exatamente o que a lista mostra ao clicar nele.

async function contar(filtros) {
  const { where, params } = montarFiltro(filtros);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM_CHAMADO} ${where}`, params);
  return Number(total);
}

// { aberto: 2, andamento: 1, resolvido: 1, cancelado: 0 }
async function contarPorTipo(filtros) {
  const { where, params } = montarFiltro(filtros);
  const [linhas] = await pool.query(`SELECT s.tipo, COUNT(*) AS total ${FROM_CHAMADO} ${where} GROUP BY s.tipo`, params);
  return Object.fromEntries(linhas.map((l) => [l.tipo, Number(l.total)]));
}

async function contarPorCategoria(filtros) {
  const { where, params } = montarFiltro(filtros);
  const [linhas] = await pool.query(
    `SELECT cat.id, cat.nome, COUNT(*) AS total ${FROM_CHAMADO} ${where}
      GROUP BY cat.id, cat.nome
      ORDER BY total DESC, cat.nome`,
    params
  );
  return linhas.map((l) => ({ ...l, total: Number(l.total) }));
}

module.exports = { contar, contarPorTipo, contarPorCategoria };
