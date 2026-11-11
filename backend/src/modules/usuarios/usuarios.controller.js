const service = require("./usuarios.service");
const { ok, created, wrapAll } = require("../../shared/http");

module.exports = wrapAll({
  async listar(req, res) {
    return ok(res, await service.listar());
  },

  async buscarPorId(req, res) {
    return ok(res, await service.buscarPorId(req.params.id));
  },

  async criar(req, res) {
    const { data, message } = await service.criar(req.body);
    return created(res, data, { message });
  },

  async atualizar(req, res) {
    const { data, message } = await service.atualizar(req.params.id, req.body, req.usuario);
    return ok(res, data, { message });
  },

  async redefinirSenha(req, res) {
    const { data, message } = await service.redefinirSenha(req.params.id, req.usuario);
    return ok(res, data, { message });
  }
});
