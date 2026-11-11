const service = require("./auth.service");
const env = require("../../config/env");
const { ok, wrapAll } = require("../../shared/http");

// Cookie do refresh token: o JavaScript da página não consegue ler (httpOnly) e ele só vai para /api/auth.
const COOKIE = "helpdesk_sessao";
const opcoesCookie = {
  httpOnly: true,
  secure: env.producao, // em produção só via HTTPS
  sameSite: "lax",
  path: "/api/auth"
};

function gravarCookie(res, { refreshToken, expiraEm }) {
  res.cookie(COOKIE, refreshToken, { ...opcoesCookie, expires: expiraEm });
}

module.exports = wrapAll({
  async login(req, res) {
    const sessao = await service.login(req.body, req.headers["user-agent"]);
    gravarCookie(res, sessao);
    return ok(res, { token: sessao.token, usuario: sessao.usuario });
  },

  async renovar(req, res) {
    try {
      const sessao = await service.renovar(req.cookies[COOKIE], req.headers["user-agent"]);
      gravarCookie(res, sessao);
      return ok(res, { token: sessao.token, usuario: sessao.usuario });
    } catch (erro) {
      res.clearCookie(COOKIE, opcoesCookie); // sessão inválida: apaga o cookie velho
      throw erro;
    }
  },

  async sair(req, res) {
    await service.sair(req.cookies[COOKIE]);
    res.clearCookie(COOKIE, opcoesCookie);
    return ok(res, null, { message: "Você saiu do sistema." });
  },

  async eu(req, res) {
    return ok(res, await service.eu(req.usuario.id));
  },

  async trocarSenha(req, res) {
    const { data, message } = await service.trocarSenha(req.usuario.id, req.body);
    return ok(res, data, { message });
  }
});
