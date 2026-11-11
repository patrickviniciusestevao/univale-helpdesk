const repository = require("./usuarios.repository");
const sessoes = require("../auth/sessoes.repository");
const cadastros = require("../cadastros/cadastros.service");
const senhas = require("../../shared/senhas");
const { PERFIS } = require("../../shared/auth");
const { badRequest, conflict, notFound } = require("../../shared/errors");
const { mergeDefined } = require("../../shared/http");

// O que a tela de usuários pode ver (nunca a senha).
function publico(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    setor_id: u.setor_id ?? null,
    setor: u.setor ?? null,
    ativo: Boolean(u.ativo),
    trocar_senha: Boolean(u.trocar_senha),
    ultimo_acesso: u.ultimo_acesso,
    criado_em: u.criado_em
  };
}

async function listar() {
  return (await repository.listar()).map(publico);
}

async function buscarPorId(id) {
  const usuario = await repository.buscarPorId(id);
  if (!usuario) throw notFound("Usuário não encontrado.");
  return publico(usuario);
}

async function garantirEmailLivre(email, idAtual) {
  const dono = await repository.buscarIdPorEmail(email);
  if (dono && dono !== idAtual) throw conflict("Já existe um usuário com esse e-mail.");
}

/**
 * Cria o usuário com uma senha temporária gerada pelo sistema.
 * A senha volta UMA vez na resposta, para o administrador repassar; no banco fica só o hash.
 */
async function criar(dados) {
  await garantirEmailLivre(dados.email);
  if (dados.setor_id) await cadastros.garantirAtivo("setores", dados.setor_id);

  const senhaTemporaria = senhas.gerarSenhaTemporaria();
  const id = await repository.inserir({ ...dados, senha_hash: await senhas.gerarHash(senhaTemporaria) });
  return {
    data: { usuario: await buscarPorId(id), senha_temporaria: senhaTemporaria },
    message: "Usuário criado. Repasse a senha temporária para a pessoa."
  };
}

/**
 * Regras que protegem o acesso administrativo:
 * - ninguém tira o próprio perfil de administrador nem se desativa (evita trancar a si mesmo para fora);
 * - sempre sobra pelo menos um administrador ativo.
 */
async function atualizar(id, dados, quemAltera) {
  const existente = await buscarPorId(id);
  const novo = mergeDefined(existente, dados);
  const eleMesmo = id === quemAltera.id;

  if (eleMesmo && novo.perfil !== PERFIS.ADMIN) throw badRequest("Você não pode tirar o seu próprio perfil de administrador.");
  if (eleMesmo && !novo.ativo) throw badRequest("Você não pode desativar o seu próprio usuário.");

  const deixaDeSerAdminAtivo = existente.perfil === PERFIS.ADMIN && existente.ativo && (novo.perfil !== PERFIS.ADMIN || !novo.ativo);
  if (deixaDeSerAdminAtivo && (await repository.contarAdminsAtivos()) <= 1) {
    throw badRequest("Este é o último administrador ativo. Promova outra pessoa antes.");
  }

  if (dados.email !== undefined) await garantirEmailLivre(novo.email, id);
  if (dados.setor_id && dados.setor_id !== existente.setor_id) await cadastros.garantirAtivo("setores", dados.setor_id);

  await repository.atualizar(id, novo);
  // Desativado ou perfil trocado: encerra as sessões. O acesso atual vale no máximo até o token vencer (15 min);
  // depois ele precisa entrar de novo (e entra com o perfil novo — ou não entra, se desativado).
  if ((existente.ativo && !novo.ativo) || existente.perfil !== novo.perfil) await sessoes.revogarTodasDoUsuario(id);

  const message =
    existente.ativo && !novo.ativo ? "Usuário desativado." : !existente.ativo && novo.ativo ? "Usuário reativado." : "Usuário atualizado.";
  return { data: await buscarPorId(id), message };
}

// "Esqueci a senha": nova senha temporária, troca obrigatória e todas as sessões encerradas.
async function redefinirSenha(id, quemAltera) {
  if (id === quemAltera.id) throw badRequest('Para trocar a sua própria senha, use "Trocar senha" no menu do seu usuário.');
  await buscarPorId(id);

  const senhaTemporaria = senhas.gerarSenhaTemporaria();
  await repository.definirSenhaTemporaria(id, await senhas.gerarHash(senhaTemporaria));
  await sessoes.revogarTodasDoUsuario(id);
  return {
    data: { usuario: await buscarPorId(id), senha_temporaria: senhaTemporaria },
    message: "Senha redefinida. Repasse a senha temporária para a pessoa."
  };
}

module.exports = { listar, buscarPorId, criar, atualizar, redefinirSenha };
