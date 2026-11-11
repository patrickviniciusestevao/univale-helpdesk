const { pool } = require("../../config/db");

// Linha do tempo do chamado (tabela chamado_historico, migração 004).
// tipo: abertura | edicao | status | prioridade | responsavel | observacao | reabertura

async function inserir({ chamado_id, usuario_id, tipo, valor_anterior, valor_novo, texto, interna }, conn = pool) {
  await conn.query(
    `INSERT INTO chamado_historico (chamado_id, usuario_id, tipo, valor_anterior, valor_novo, texto, interna)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [chamado_id, usuario_id, tipo, valor_anterior ?? null, valor_novo ?? null, texto ?? null, Boolean(interna)]
  );
}

// incluirInternas = false para o solicitante (observações internas são só da equipe).
async function listarPorChamado(chamadoId, { incluirInternas }) {
  const [linhas] = await pool.query(
    `SELECT h.id, h.tipo, h.valor_anterior, h.valor_novo, h.texto, h.interna, h.criado_em,
            h.usuario_id, u.nome AS usuario, u.perfil AS usuario_perfil
       FROM chamado_historico h
       INNER JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.chamado_id = ? ${incluirInternas ? "" : "AND h.interna = FALSE"}
      ORDER BY h.criado_em, h.id`,
    [chamadoId]
  );
  return linhas.map((l) => ({ ...l, interna: Boolean(l.interna) }));
}

module.exports = { inserir, listarPorChamado };
