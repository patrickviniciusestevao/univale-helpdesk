const { pool } = require("../../config/db");

// Tabelas da consulta (também usadas na contagem da paginação e no dashboard).
const FROM_CHAMADO = `
  FROM chamados c
  INNER JOIN usuarios u ON u.id = c.usuario_solicitante_id
  LEFT JOIN usuarios r ON r.id = c.usuario_responsavel_id
  LEFT JOIN setores st ON st.id = c.setor_id
  INNER JOIN categorias cat ON cat.id = c.categoria_id
  INNER JOIN prioridades p ON p.id = c.prioridade_id
  INNER JOIN status_chamados s ON s.id = c.status_id
`;

// Uma consulta base só, usada pela lista e pelo detalhe.
// Devolve ids (para formulários) e nomes/cores (para exibir). Solicitante e responsável vêm do cadastro de usuários.
const SELECT_CHAMADO = `
  SELECT
    c.id,
    c.titulo,
    c.descricao,
    c.usuario_solicitante_id,
    u.nome AS solicitante,
    u.email AS solicitante_email,
    c.usuario_responsavel_id,
    r.nome AS responsavel,
    c.setor_id,
    st.nome AS setor,
    c.categoria_id,
    cat.nome AS categoria,
    c.prioridade_id,
    p.nome AS prioridade,
    p.nivel AS prioridade_nivel,
    p.cor AS prioridade_cor,
    c.status_id,
    s.nome AS status,
    s.tipo AS status_tipo,
    s.cor AS status_cor,
    c.data_abertura,
    c.data_atualizacao,
    c.data_encerramento
  ${FROM_CHAMADO}
`;

/**
 * Monta o WHERE a partir dos filtros (já validados na rota). Valores sempre como parâmetro (?).
 *   usuarioSolicitanteId → só os chamados dessa pessoa (usuário comum)
 *   busca       → nº do chamado ("17" ou "#17") ou trecho do título, descrição ou nome do solicitante
 *   tipo        → tipo do status (aberto, andamento, resolvido, cancelado)
 *   situacao    → "ativos" (não encerrados) ou "encerrados"
 *   responsavel → id do responsável ou "nenhum"
 *   alta        → maior nível de prioridade entre as prioridades ativas
 */
function montarFiltro(f = {}) {
  const condicoes = [];
  const params = [];
  const igual = (coluna, valor) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      condicoes.push(`${coluna} = ?`);
      params.push(valor);
    }
  };

  igual("c.usuario_solicitante_id", f.usuarioSolicitanteId);
  igual("c.status_id", f.status_id);
  igual("s.tipo", f.tipo);
  igual("c.prioridade_id", f.prioridade_id);
  igual("c.categoria_id", f.categoria_id);
  igual("c.setor_id", f.setor_id);

  if (f.responsavel === "nenhum") condicoes.push("c.usuario_responsavel_id IS NULL");
  else igual("c.usuario_responsavel_id", f.responsavel);

  if (f.situacao === "ativos") condicoes.push("s.tipo IN ('aberto', 'andamento')");
  if (f.situacao === "encerrados") condicoes.push("s.tipo IN ('resolvido', 'cancelado')");
  if (f.alta) condicoes.push("p.nivel = (SELECT MAX(nivel) FROM prioridades WHERE ativo = 1)");

  if (f.busca) {
    const numero = f.busca.replace(/^#/, "");
    const termo = `%${f.busca}%`;
    if (/^\d+$/.test(numero)) {
      condicoes.push("(c.id = ? OR c.titulo LIKE ?)");
      params.push(Number(numero), `%${numero}%`);
    } else {
      condicoes.push("(c.titulo LIKE ? OR c.descricao LIKE ? OR u.nome LIKE ?)");
      params.push(termo, termo, termo);
    }
  }

  return { where: condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "", params };
}

// Lista uma página (mais recentes primeiro) e conta o total que bate com os filtros.
async function listar(filtros = {}, { pagina = 1, porPagina = 20 } = {}) {
  const { where, params } = montarFiltro(filtros);
  const [linhas] = await pool.query(`${SELECT_CHAMADO} ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`, [
    ...params,
    porPagina,
    (pagina - 1) * porPagina
  ]);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${FROM_CHAMADO} ${where}`, params);
  return { linhas, total: Number(total) };
}

async function buscarPorId(id, conn = pool) {
  const [linhas] = await conn.query(`${SELECT_CHAMADO} WHERE c.id = ? LIMIT 1`, [id]);
  return linhas[0] || null;
}

// "conn" permite gravar o chamado e o histórico na mesma transação.
async function inserir({ titulo, descricao, usuario_solicitante_id, setor_id, categoria_id, prioridade_id, status_id }, conn = pool) {
  const [resultado] = await conn.query(
    `INSERT INTO chamados (titulo, descricao, usuario_solicitante_id, setor_id, categoria_id, prioridade_id, status_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descricao, usuario_solicitante_id, setor_id ?? null, categoria_id, prioridade_id, status_id]
  );
  return resultado.insertId;
}

async function atualizar(
  id,
  { titulo, descricao, setor_id, categoria_id, prioridade_id, status_id, usuario_responsavel_id, data_encerramento },
  conn = pool
) {
  await conn.query(
    `UPDATE chamados
        SET titulo = ?, descricao = ?, setor_id = ?, categoria_id = ?, prioridade_id = ?, status_id = ?,
            usuario_responsavel_id = ?, data_encerramento = ?
      WHERE id = ?`,
    [titulo, descricao, setor_id ?? null, categoria_id, prioridade_id, status_id, usuario_responsavel_id ?? null, data_encerramento ?? null, id]
  );
}

async function excluir(id) {
  const [resultado] = await pool.query("DELETE FROM chamados WHERE id = ?", [id]);
  return resultado.affectedRows > 0;
}

module.exports = { FROM_CHAMADO, montarFiltro, listar, buscarPorId, inserir, atualizar, excluir };
