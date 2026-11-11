const crypto = require("crypto");
const env = require("../../config/env");
const usuarios = require("../usuarios/usuarios.repository");
const sessoes = require("./sessoes.repository");
const { gerarTokenAcesso } = require("../../shared/auth");
const senhas = require("../../shared/senhas");
const { badRequest, unauthorized, forbidden, notFound } = require("../../shared/errors");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// O que o frontend pode saber do usuário (nunca a senha).
function publico(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    setor_id: u.setor_id ?? null,
    setor: u.setor ?? null,
    trocar_senha: Boolean(u.trocar_senha)
  };
}

/**
 * Abre uma sessão: token de acesso (JWT curto, vai no corpo) + refresh token (longo, vai no cookie).
 * No banco fica só o hash do refresh token.
 */
async function criarSessao(usuario, userAgent) {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const expiraEm = new Date(Date.now() + env.auth.sessaoDias * 24 * 60 * 60 * 1000);
  await sessoes.criar({
    usuario_id: usuario.id,
    token_hash: hashToken(refreshToken),
    user_agent: userAgent?.slice(0, 255) ?? null,
    expira_em: expiraEm
  });
  return { token: gerarTokenAcesso(usuario), refreshToken, expiraEm, usuario: publico(usuario) };
}

async function login({ email, senha }, userAgent) {
  const usuario = await usuarios.buscarParaLogin(email);
  const senhaConfere = await senhas.conferir(senha, usuario?.senha_hash ?? senhas.HASH_FALSO);
  // Mesma mensagem para e-mail inexistente e senha errada.
  if (!usuario || !senhaConfere) throw unauthorized("E-mail ou senha incorretos.");
  if (!usuario.ativo) throw forbidden("Usuário desativado. Procure o administrador.");

  await usuarios.registrarAcesso(usuario.id);
  return criarSessao(await usuarios.buscarPorId(usuario.id), userAgent);
}

// Troca um refresh token válido por um novo par de tokens (o antigo é encerrado: "rotação").
async function renovar(refreshToken, userAgent) {
  if (!refreshToken) throw unauthorized("Sessão encerrada. Faça login.");
  const sessao = await sessoes.buscarValidaPorHash(hashToken(refreshToken));
  if (!sessao) throw unauthorized("Sessão encerrada. Faça login.");

  await sessoes.revogar(sessao.id);
  const usuario = await usuarios.buscarPorId(sessao.usuario_id);
  if (!usuario || !usuario.ativo) throw unauthorized("Usuário desativado. Procure o administrador.");
  return criarSessao(usuario, userAgent);
}

async function sair(refreshToken) {
  if (refreshToken) await sessoes.revogarPorHash(hashToken(refreshToken));
}

async function eu(id) {
  const usuario = await usuarios.buscarPorId(id);
  if (!usuario) throw notFound("Usuário não encontrado.");
  return publico(usuario);
}

async function trocarSenha(id, { senha_atual, nova_senha }) {
  const hashAtual = await usuarios.buscarSenhaHash(id);
  if (!hashAtual || !(await senhas.conferir(senha_atual, hashAtual))) throw badRequest("Senha atual incorreta.");
  if (senha_atual === nova_senha) throw badRequest("A nova senha precisa ser diferente da atual.");

  await usuarios.atualizarSenha(id, await senhas.gerarHash(nova_senha));
  const usuario = await usuarios.buscarPorId(id);
  // Novo token de acesso, já sem a marca de "trocar senha".
  return { data: { token: gerarTokenAcesso(usuario), usuario: publico(usuario) }, message: "Senha alterada com sucesso." };
}

// Chamado pelo server.js ao subir e uma vez por dia.
async function limparSessoesAntigas() {
  return sessoes.apagarAntigas(30);
}

module.exports = { limparSessoesAntigas, login, renovar, sair, eu, trocarSenha };
