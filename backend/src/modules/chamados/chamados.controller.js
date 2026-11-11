const service = require("./chamados.service");
const { ok, created, wrapAll } = require("../../shared/http");

// req.usuario vem do middleware autenticar: o service decide o que cada perfil pode ver e fazer.
// Ações devolvem { data, message } e o controller só repassa.
const responder = (res, { data, message }) => ok(res, data, { message });

module.exports = wrapAll({
  async listar(req, res) {
    const { pagina, por_pagina, ...filtros } = req.query;
    const { data, meta } = await service.listar(req.usuario, filtros, { pagina, porPagina: por_pagina });
    return ok(res, data, { meta });
  },

  async buscarPorId(req, res) {
    return ok(res, await service.buscarPorId(req.params.id, req.usuario));
  },

  async criar(req, res) {
    const { data, message } = await service.criar(req.body, req.usuario);
    return created(res, data, { message });
  },

  async atualizar(req, res) {
    return responder(res, await service.atualizar(req.params.id, req.body, req.usuario));
  },

  async assumir(req, res) {
    return responder(res, await service.assumir(req.params.id, req.usuario));
  },

  async cancelar(req, res) {
    return responder(res, await service.cancelar(req.params.id, req.usuario));
  },

  async reabrir(req, res) {
    return responder(res, await service.reabrir(req.params.id, req.body, req.usuario));
  },

  async comentar(req, res) {
    const { data, message } = await service.comentar(req.params.id, req.body, req.usuario);
    return created(res, data, { message });
  },

  async historico(req, res) {
    return ok(res, await service.listarHistorico(req.params.id, req.usuario));
  },

  async excluir(req, res) {
    return responder(res, await service.excluir(req.params.id));
  }
});
