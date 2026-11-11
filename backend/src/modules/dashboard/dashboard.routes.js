const express = require("express");
const service = require("./dashboard.service");
const { ok, wrapAll } = require("../../shared/http");

// Controller pequeno o bastante para ficar junto da rota.
const controller = wrapAll({
  async resumo(req, res) {
    return ok(res, await service.resumo(req.usuario));
  }
});

const router = express.Router();

// GET /api/dashboard → indicadores da tela Início (logado; o conteúdo depende do perfil)
router.get("/", controller.resumo);

module.exports = router;
