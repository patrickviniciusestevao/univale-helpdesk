const express = require("express");
const { z } = require("zod");
const controller = require("./cadastros.controller");
const { CORES, TIPOS_STATUS, TIPOS } = require("./cadastros.tipos");
const { validate, id, textoObrigatorio } = require("../../shared/validate");
const { exigirPerfil, PERFIS } = require("../../shared/auth");
const { notFound } = require("../../shared/errors");

const router = express.Router();

// Campos que todo cadastro tem + os extras de cada tipo.
const cor = z.enum(CORES, { message: "Escolha uma cor." });
const EXTRAS = {
  prioridades: {
    nivel: z.coerce.number({ invalid_type_error: "Informe o nível." }).int("Use um número inteiro.").min(1, "O nível vai de 1 a 9.").max(9, "O nível vai de 1 a 9."),
    cor
  },
  status: {
    tipo: z.enum(TIPOS_STATUS, { message: "Escolha o tipo do status." }),
    inicial: z.boolean().optional(),
    cor,
    ordem: z.coerce.number({ invalid_type_error: "Informe a ordem." }).int("Use um número inteiro.").min(0, "A ordem vai de 0 a 999.").max(999, "A ordem vai de 0 a 999.")
  }
};

const SCHEMAS = Object.fromEntries(
  Object.entries(TIPOS).map(([tipo, config]) => {
    const criar = z.object({
      nome: textoObrigatorio("o nome", config.maxNome),
      ativo: z.boolean().optional(),
      ...(EXTRAS[tipo] ?? {})
    });
    const atualizar = criar.partial().refine((d) => Object.values(d).some((v) => v !== undefined), "Envie ao menos um campo para alterar.");
    return [tipo, { criar, atualizar }];
  })
);

// Escolhe o schema do corpo conforme o tipo da URL (/api/cadastros/status → schema de status).
function validarCorpo(acao) {
  return (req, res, next) => {
    const schemas = SCHEMAS[req.params.tipo];
    if (!schemas) return next(notFound(`Cadastro "${req.params.tipo}" não existe. Use: ${Object.keys(TIPOS).join(", ")}.`));
    return validate({ body: schemas[acao] })(req, res, next);
  };
}

const somenteAdmin = exigirPerfil(PERFIS.ADMIN);

// GET /api/cadastros/categorias?ativos=1 → lista para formulários e filtros (qualquer usuário logado)
router.get(
  "/:tipo",
  validate({ query: z.object({ ativos: z.enum(["0", "1"], { message: "Use ativos=1 (só ativos) ou ativos=0 (todos)." }).optional().transform((v) => v === "1") }) }),
  controller.listar
);
// Manutenção: só administrador. Não há DELETE — cadastro se desativa (ativo: false).
router.post("/:tipo", somenteAdmin, validarCorpo("criar"), controller.criar);
router.patch("/:tipo/:id", somenteAdmin, validate({ params: z.object({ tipo: z.string(), id: id() }) }), validarCorpo("atualizar"), controller.atualizar);

module.exports = router;
