const repository = require("./dashboard.repository");
const chamados = require("../chamados/chamados.repository");
const { PERFIS } = require("../../shared/auth");

/**
 * Indicadores da tela Início, calculados no servidor (B-14, B-26).
 * Administrador: todos os chamados + "meus atendimentos" e "sem responsável".
 * Usuário comum: só os chamados que ele abriu.
 * Cada número corresponde a um filtro da lista de chamados (o frontend usa os mesmos filtros nos links).
 */
async function resumo(usuario) {
  const admin = usuario.perfil === PERFIS.ADMIN;
  const base = admin ? {} : { usuarioSolicitanteId: usuario.id };

  const [porTipo, total, alta, porCategoria, recentes, semResponsavel, meus] = await Promise.all([
    repository.contarPorTipo(base),
    repository.contar(base),
    repository.contar({ ...base, alta: true, situacao: "ativos" }),
    repository.contarPorCategoria(base),
    chamados.listar(base, { pagina: 1, porPagina: 6 }),
    admin ? repository.contar({ responsavel: "nenhum", situacao: "ativos" }) : null,
    admin ? repository.contar({ responsavel: usuario.id, situacao: "ativos" }) : null
  ]);

  return {
    total,
    por_tipo: {
      aberto: porTipo.aberto ?? 0,
      andamento: porTipo.andamento ?? 0,
      resolvido: porTipo.resolvido ?? 0,
      cancelado: porTipo.cancelado ?? 0
    },
    alta_prioridade: alta,
    sem_responsavel: semResponsavel,
    meus_atendimentos: meus,
    por_categoria: porCategoria,
    recentes: recentes.linhas
  };
}

module.exports = { resumo };
