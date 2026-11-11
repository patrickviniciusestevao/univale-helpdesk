const service = require("./cadastros.service");
const { ok, created, wrapAll } = require("../../shared/http");

module.exports = wrapAll({
  async listar(req, res) {
    return ok(res, await service.listar(req.params.tipo, { somenteAtivos: req.query.ativos }));
  },

  async criar(req, res) {
    const { data, message } = await service.criar(req.params.tipo, req.body);
    return created(res, data, { message });
  },

  async atualizar(req, res) {
    const { data, message } = await service.atualizar(req.params.tipo, req.params.id, req.body);
    return ok(res, data, { message });
  }
});
