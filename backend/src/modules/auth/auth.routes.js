const express = require("express");
const { z } = require("zod");
const controller = require("./auth.controller");
const { validate } = require("../../shared/validate");
const { autenticar } = require("../../shared/auth");
const { limitesLogin } = require("../../shared/limites");

const router = express.Router();

const loginSchema = z.object({
  email: z.string({ required_error: "Informe o e-mail." }).trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string({ required_error: "Informe a senha." }).min(1, "Informe a senha.")
});

const trocarSenhaSchema = z.object({
  senha_atual: z.string({ required_error: "Informe a senha atual." }).min(1, "Informe a senha atual."),
  nova_senha: z
    .string({ required_error: "Informe a nova senha." })
    .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
    .max(72, "A nova senha deve ter no máximo 72 caracteres.") // limite do bcrypt
    .regex(/[A-Za-z]/, "A nova senha precisa ter pelo menos uma letra.")
    .regex(/[0-9]/, "A nova senha precisa ter pelo menos um número.")
});

router.post("/login", ...limitesLogin, validate({ body: loginSchema }), controller.login);
router.post("/refresh", controller.renovar); // usa o cookie, não o token
router.post("/logout", controller.sair);
router.get("/me", autenticar, controller.eu);
router.patch("/senha", autenticar, validate({ body: trocarSenhaSchema }), controller.trocarSenha);

module.exports = router;
