const express = require("express");
const { z } = require("zod");
const controller = require("./usuarios.controller");
const { validate, id, idParam, textoObrigatorio } = require("../../shared/validate");
const { PERFIS } = require("../../shared/auth");

// Todas as rotas daqui são só de administrador (conferido em app.js).
const router = express.Router();

const criarSchema = z.object({
  nome: textoObrigatorio("o nome", 120),
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(150, "O e-mail deve ter no máximo 150 caracteres."),
  perfil: z.enum(Object.values(PERFIS), { message: "Escolha o perfil." }),
  setor_id: id("Escolha o setor.").nullable().optional()
});

const atualizarSchema = criarSchema
  .partial()
  .extend({ ativo: z.boolean().optional() })
  .refine((d) => Object.values(d).some((v) => v !== undefined), "Envie ao menos um campo para alterar.");

router.get("/", controller.listar);
router.get("/:id", validate({ params: idParam }), controller.buscarPorId);
router.post("/", validate({ body: criarSchema }), controller.criar);
router.patch("/:id", validate({ params: idParam, body: atualizarSchema }), controller.atualizar);
// Não há DELETE: usuário se desativa (os chamados dele continuam).
router.post("/:id/redefinir-senha", validate({ params: idParam }), controller.redefinirSenha);

module.exports = router;
