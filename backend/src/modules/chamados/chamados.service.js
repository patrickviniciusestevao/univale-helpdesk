const repository = require("./chamados.repository");
const historico = require("./historico.repository");
const cadastros = require("../cadastros/cadastros.service");
const usuarios = require("../usuarios/usuarios.repository");
const { withTransaction } = require("../../config/db");
const { PERFIS } = require("../../shared/auth");
const { badRequest, forbidden, notFound } = require("../../shared/errors");
const { mergeDefined } = require("../../shared/http");

// Tipos de status que as regras usam (cadastro de status, migração 003). O nome do status pode ser qualquer um.
const TIPO = { ABERTO: "aberto", ANDAMENTO: "andamento", RESOLVIDO: "resolvido", CANCELADO: "cancelado" };
const ENCERRADOS = [TIPO.RESOLVIDO, TIPO.CANCELADO];

// O solicitante pode reabrir um chamado resolvido por até 7 dias (decisão do dono, R-009).
const PRAZO_REABERTURA_DIAS = 7;

// Campo do chamado → tipo de cadastro que ele referencia.
const REFERENCIAS = { categoria_id: "categorias", prioridade_id: "prioridades", status_id: "status", setor_id: "setores" };

// O que o usuário comum pode mudar no próprio chamado (enquanto estiver Aberto).
const CAMPOS_DO_SOLICITANTE = ["titulo", "descricao", "categoria_id", "prioridade_id"];

const ehAdmin = (usuario) => usuario.perfil === PERFIS.ADMIN;

/**
 * Busca o chamado respeitando quem pede: o usuário comum só enxerga os próprios.
 * Chamado de outra pessoa responde "não encontrado" (não revela que existe).
 */
async function buscarPorId(id, usuario) {
  const chamado = await repository.buscarPorId(id);
  if (!chamado || (!ehAdmin(usuario) && chamado.usuario_solicitante_id !== usuario.id)) {
    throw notFound("Chamado não encontrado.");
  }
  return chamado;
}

/**
 * Lista com filtros e paginação feitos no servidor (B-22).
 * Usuário comum: sempre só os próprios chamados. responsavel "eu" = quem está logado.
 */
async function listar(usuario, filtros = {}, { pagina = 1, porPagina = 20 } = {}) {
  const f = { ...filtros };
  if (f.responsavel === "eu") f.responsavel = usuario.id;
  if (!ehAdmin(usuario)) f.usuarioSolicitanteId = usuario.id;

  const { linhas, total } = await repository.listar(f, { pagina, porPagina });
  return { data: linhas, meta: { total, pagina, por_pagina: porPagina, paginas: Math.max(1, Math.ceil(total / porPagina)) } };
}

// ---------------------------------------------------------------------------
// Histórico: compara o chamado antes e depois e descreve o que mudou.
// ---------------------------------------------------------------------------
function diferencas(antes, depois, ignorar = []) {
  const linhas = [];
  const mudou = (campo) => antes[campo] !== depois[campo] && !ignorar.includes(campo);

  if (mudou("status_id")) linhas.push({ tipo: "status", valor_anterior: antes.status, valor_novo: depois.status });
  if (mudou("prioridade_id")) linhas.push({ tipo: "prioridade", valor_anterior: antes.prioridade, valor_novo: depois.prioridade });
  if (mudou("usuario_responsavel_id")) {
    linhas.push({ tipo: "responsavel", valor_anterior: antes.responsavel, valor_novo: depois.responsavel });
  }

  // Demais campos viram uma linha só de "edição": "Alterou título, categoria (Hardware → Rede)".
  const campos = [];
  if (mudou("titulo")) campos.push("título");
  if (mudou("descricao")) campos.push("descrição");
  if (mudou("categoria_id")) campos.push(`categoria (${antes.categoria} → ${depois.categoria})`);
  if (mudou("setor_id")) campos.push(`setor (${antes.setor ?? "sem setor"} → ${depois.setor ?? "sem setor"})`);
  if (campos.length) linhas.push({ tipo: "edicao", texto: `Alterou ${campos.join(", ")}` });

  return linhas;
}

/**
 * Grava a alteração e o histórico na MESMA transação: ou os dois ficam, ou nenhum.
 * extras(depois) devolve linhas a mais (ex.: reabertura com o motivo).
 */
async function salvarComHistorico(id, existente, novo, autor, { ignorar = [], extras } = {}) {
  return withTransaction(async (conn) => {
    await repository.atualizar(id, novo, conn);
    const depois = await repository.buscarPorId(id, conn);
    const linhas = [...diferencas(existente, depois, ignorar), ...(extras ? extras(depois) : [])];
    for (const linha of linhas) await historico.inserir({ chamado_id: id, usuario_id: autor.id, ...linha }, conn);
    return depois;
  });
}

// Data de encerramento acompanha o status: entra ao resolver/cancelar, sai ao voltar para aberto/andamento.
function dataEncerramento(existente, tipoNovo) {
  const estavaEncerrado = ENCERRADOS.includes(existente.status_tipo);
  const ficaEncerrado = ENCERRADOS.includes(tipoNovo);
  if (ficaEncerrado && !estavaEncerrado) return new Date();
  if (!ficaEncerrado) return null;
  return existente.data_encerramento;
}

async function garantirResponsavelValido(usuarioId) {
  if (usuarioId === null || usuarioId === undefined) return;
  const responsavel = await usuarios.buscarPorId(usuarioId);
  if (!responsavel || responsavel.perfil !== PERFIS.ADMIN || !responsavel.ativo) {
    throw badRequest("O responsável precisa ser um administrador ativo.");
  }
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------
async function criar(dados, usuario) {
  await cadastros.garantirAtivo("categorias", dados.categoria_id);
  await cadastros.garantirAtivo("prioridades", dados.prioridade_id);

  // Solicitante = quem está logado; setor copiado do cadastro dele; status = o inicial do cadastro.
  const solicitante = await usuarios.buscarPorId(usuario.id);
  const status_id = await cadastros.statusInicialId();

  const chamado = await withTransaction(async (conn) => {
    const id = await repository.inserir({ ...dados, usuario_solicitante_id: usuario.id, setor_id: solicitante?.setor_id, status_id }, conn);
    const criado = await repository.buscarPorId(id, conn);
    await historico.inserir({ chamado_id: id, usuario_id: usuario.id, tipo: "abertura", valor_novo: criado.status }, conn);
    return criado;
  });
  return { data: chamado, message: "Chamado aberto com sucesso." };
}

async function atualizar(id, dados, usuario) {
  const existente = await buscarPorId(id, usuario);

  if (!ehAdmin(usuario)) {
    if (existente.status_tipo !== TIPO.ABERTO) {
      throw forbidden("Este chamado já está em atendimento. Só a equipe de suporte pode alterá-lo.");
    }
    const proibidos = Object.keys(dados).filter((campo) => dados[campo] !== undefined && !CAMPOS_DO_SOLICITANTE.includes(campo));
    if (proibidos.length > 0) throw forbidden("Status, setor e responsável só podem ser alterados pela equipe de suporte.");
  }

  // Confere só o que mudou: um chamado antigo pode manter um cadastro que foi desativado depois.
  let tipoStatusNovo = existente.status_tipo;
  for (const [campo, tipo] of Object.entries(REFERENCIAS)) {
    if (dados[campo] !== undefined && dados[campo] !== null && dados[campo] !== existente[campo]) {
      const item = await cadastros.garantirAtivo(tipo, dados[campo]);
      if (campo === "status_id") tipoStatusNovo = item.tipo;
    }
  }
  if (dados.usuario_responsavel_id !== existente.usuario_responsavel_id) await garantirResponsavelValido(dados.usuario_responsavel_id);

  const novo = { ...mergeDefined(existente, dados), data_encerramento: dataEncerramento(existente, tipoStatusNovo) };
  return { data: await salvarComHistorico(id, existente, novo, usuario), message: "Chamado atualizado com sucesso." };
}

// "Patrick está atendendo": o administrador vira o responsável. Chamado Aberto passa para o primeiro status "Em andamento".
async function assumir(id, usuario) {
  const existente = await buscarPorId(id, usuario);
  if (ENCERRADOS.includes(existente.status_tipo)) throw badRequest("Chamado encerrado. Reabra-o antes de assumir.");
  if (existente.usuario_responsavel_id === usuario.id && existente.status_tipo !== TIPO.ABERTO) {
    throw badRequest("Você já é o responsável por este chamado.");
  }

  const novo = { ...existente, usuario_responsavel_id: usuario.id };
  if (existente.status_tipo === TIPO.ABERTO) novo.status_id = await cadastros.primeiroStatusDoTipo(TIPO.ANDAMENTO);
  return { data: await salvarComHistorico(id, existente, novo, usuario), message: `Você assumiu o chamado #${id}.` };
}

// Desistência: o solicitante cancela enquanto está Aberto; o administrador cancela qualquer um.
async function cancelar(id, usuario) {
  const existente = await buscarPorId(id, usuario);
  if (existente.status_tipo === TIPO.CANCELADO) throw badRequest("Este chamado já está cancelado.");
  if (!ehAdmin(usuario) && existente.status_tipo !== TIPO.ABERTO) {
    throw forbidden("Este chamado já está em atendimento. Fale com a equipe de suporte para cancelá-lo.");
  }

  const novo = {
    ...existente,
    status_id: await cadastros.primeiroStatusDoTipo(TIPO.CANCELADO),
    data_encerramento: dataEncerramento(existente, TIPO.CANCELADO)
  };
  return { data: await salvarComHistorico(id, existente, novo, usuario), message: "Chamado cancelado." };
}

// O problema voltou: chamado resolvido volta ao status inicial, com o motivo no histórico.
async function reabrir(id, { motivo }, usuario) {
  const existente = await buscarPorId(id, usuario);
  if (existente.status_tipo !== TIPO.RESOLVIDO) throw badRequest("Só chamados resolvidos podem ser reabertos.");

  if (!ehAdmin(usuario) && existente.data_encerramento) {
    const dias = (Date.now() - new Date(existente.data_encerramento)) / (24 * 60 * 60 * 1000);
    if (dias > PRAZO_REABERTURA_DIAS) {
      throw forbidden(`O prazo para reabrir (${PRAZO_REABERTURA_DIAS} dias) já passou. Abra um novo chamado e cite o nº #${id}.`);
    }
  }

  const novo = { ...existente, status_id: await cadastros.statusInicialId(), data_encerramento: null };
  const depois = await salvarComHistorico(id, existente, novo, usuario, {
    ignorar: ["status_id"], // a linha de reabertura já mostra a troca de status
    extras: (d) => [{ tipo: "reabertura", valor_anterior: existente.status, valor_novo: d.status, texto: motivo }]
  });
  return { data: depois, message: "Chamado reaberto." };
}

// Observação/comentário. Interna = só a equipe vê (só administrador marca).
async function comentar(id, { texto, interna }, usuario) {
  const existente = await buscarPorId(id, usuario);
  if (!ehAdmin(usuario) && existente.status_tipo === TIPO.CANCELADO) throw badRequest("Chamado cancelado não recebe observações.");

  await historico.inserir({ chamado_id: id, usuario_id: usuario.id, tipo: "observacao", texto, interna: ehAdmin(usuario) && interna });
  return { data: null, message: interna && ehAdmin(usuario) ? "Observação interna registrada." : "Observação registrada." };
}

async function listarHistorico(id, usuario) {
  await buscarPorId(id, usuario); // confere se pode ver o chamado
  return historico.listarPorChamado(id, { incluirInternas: ehAdmin(usuario) });
}

// Exclusão definitiva: só administrador (a rota já confere), para teste ou duplicado. O histórico vai junto.
async function excluir(id) {
  const excluiu = await repository.excluir(id);
  if (!excluiu) throw notFound("Chamado não encontrado.");
  return { data: null, message: "Chamado excluído definitivamente." };
}

module.exports = {
  TIPO,
  PRAZO_REABERTURA_DIAS,
  listar,
  buscarPorId,
  criar,
  atualizar,
  assumir,
  cancelar,
  reabrir,
  comentar,
  listarHistorico,
  excluir
};
