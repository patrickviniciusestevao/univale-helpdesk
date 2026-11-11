const repository = require("./cadastros.repository");
const { TIPOS } = require("./cadastros.tipos");
const { withTransaction } = require("../../config/db");
const { badRequest, notFound } = require("../../shared/errors");
const { mergeDefined } = require("../../shared/http");

function obterTipo(tipo) {
  const config = TIPOS[tipo];
  if (!config) throw notFound(`Cadastro "${tipo}" não existe. Use: ${Object.keys(TIPOS).join(", ")}.`);
  return config;
}

// MySQL devolve BOOLEAN como 0/1; a API devolve true/false.
function normalizar(item) {
  if (!item) return item;
  const saida = { ...item, ativo: Boolean(item.ativo) };
  if ("inicial" in item) saida.inicial = Boolean(item.inicial);
  return saida;
}

async function listar(tipo, { somenteAtivos = false } = {}) {
  const linhas = await repository.listar(obterTipo(tipo), { somenteAtivos });
  return linhas.map(normalizar);
}

async function buscarPorId(tipo, id) {
  const item = normalizar(await repository.buscarPorId(obterTipo(tipo), id));
  if (!item) throw notFound(`${TIPOS[tipo].rotulo} não encontrad${TIPOS[tipo].genero}.`);
  return item;
}

/**
 * Regras do status inicial (aquele com que todo chamado nasce):
 * sempre existe exatamente um, ativo e do tipo "aberto".
 */
function validarStatus(novo, existente) {
  if (existente?.inicial && !novo.inicial) {
    throw badRequest("Para trocar o status inicial, marque outro status como inicial.");
  }
  if (novo.inicial && !novo.ativo) throw badRequest("O status inicial não pode ser desativado.");
  if (novo.inicial && novo.tipo !== "aberto") throw badRequest('O status inicial precisa ser do tipo "Aberto".');
}

// Grava; se o status virou o inicial, desmarca o anterior na mesma transação.
async function gravar(tipo, fn, viraInicial) {
  if (tipo === "status" && viraInicial) {
    return withTransaction(async (conn) => {
      await repository.desmarcarStatusInicial(conn);
      return fn(conn);
    });
  }
  return fn(undefined);
}

async function criar(tipo, dados) {
  const config = obterTipo(tipo);
  const novo = { ativo: true, ...dados };
  if (tipo === "status") validarStatus(novo, null);

  const id = await gravar(tipo, (conn) => repository.inserir(config, novo, conn), novo.inicial);
  return { data: await buscarPorId(tipo, id), message: `${config.rotulo} cadastrad${config.genero}.` };
}

async function atualizar(tipo, id, dados) {
  const config = obterTipo(tipo);
  const existente = await buscarPorId(tipo, id);
  const novo = mergeDefined(existente, dados);
  if (tipo === "status") validarStatus(novo, existente);

  const viraInicial = novo.inicial && !existente.inicial;
  await gravar(tipo, (conn) => repository.atualizar(config, id, dados, conn), viraInicial);

  const mensagem =
    dados.ativo === false && existente.ativo
      ? `${config.rotulo} desativad${config.genero}.`
      : dados.ativo === true && !existente.ativo
        ? `${config.rotulo} reativad${config.genero}.`
        : `${config.rotulo} atualizad${config.genero}.`;
  return { data: await buscarPorId(tipo, id), message: mensagem };
}

/**
 * Usado por outros módulos (ex.: chamados): garante que o item existe e está ativo (B-08).
 */
async function garantirAtivo(tipo, id) {
  const config = obterTipo(tipo);
  const item = await repository.buscarPorId(config, id);
  if (!item) throw badRequest(`${config.rotulo} não encontrad${config.genero}.`);
  if (!item.ativo) throw badRequest(`${config.rotulo} "${item.nome}" está desativad${config.genero}.`);
  return normalizar(item);
}

// Status com que todo chamado nasce (marcado como "inicial" no cadastro).
async function statusInicialId() {
  const status = await repository.buscarStatusInicial();
  if (!status) throw badRequest("Nenhum status inicial ativo. Peça ao administrador para marcar um em Cadastros > Status.");
  return status.id;
}

const ROTULO_TIPO = { aberto: "Aberto", andamento: "Em andamento", resolvido: "Resolvido", cancelado: "Cancelado" };

// Primeiro status ativo de um tipo (pela ordem). Ex.: "cancelado" → destino do botão "Cancelar chamado";
// "andamento" → status ao assumir um chamado aberto.
async function primeiroStatusDoTipo(tipo) {
  const status = await repository.buscarPrimeiroStatusDoTipo(tipo);
  if (!status) throw badRequest(`Não há status ativo do tipo "${ROTULO_TIPO[tipo]}". Cadastre um em Cadastros › Status.`);
  return status.id;
}

module.exports = { listar, buscarPorId, criar, atualizar, garantirAtivo, statusInicialId, primeiroStatusDoTipo };
