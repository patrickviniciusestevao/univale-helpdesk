const express = require("express");
const { z } = require("zod");
const controller = require("./chamados.controller");
const { validate, id, idParam, textoObrigatorio } = require("../../shared/validate");
const { exigirPerfil, PERFIS } = require("../../shared/auth");
const { TIPOS_STATUS } = require("../cadastros/cadastros.tipos");

const router = express.Router();
const somenteAdmin = exigirPerfil(PERFIS.ADMIN);

// Criação: solicitante e setor vêm do usuário logado; status é sempre o inicial (B-05). Campos extras são descartados.
const criarSchema = z.object({
  titulo: textoObrigatorio("o título", 150),
  descricao: textoObrigatorio("a descrição", 5000),
  categoria_id: id("Escolha a categoria."),
  prioridade_id: id("Escolha a prioridade.")
});

// Alteração parcial (B-12). status_id, setor_id e usuario_responsavel_id só são aceitos do administrador (conferido no service).
const atualizarSchema = criarSchema
  .partial()
  .extend({
    status_id: id("Escolha o status.").optional(),
    setor_id: id("Escolha o setor.").nullable().optional(),
    usuario_responsavel_id: id("Escolha o responsável.").nullable().optional()
  })
  .refine((dados) => Object.values(dados).some((v) => v !== undefined), "Envie ao menos um campo para alterar.");

const observacaoSchema = z.object({
  texto: textoObrigatorio("a observação", 5000),
  interna: z.boolean().optional()
});

const reabrirSchema = z.object({ motivo: textoObrigatorio("o motivo da reabertura", 1000) });

const comId = validate({ params: idParam });

// Filtros da lista (GET /api/chamados?situacao=ativos&responsavel=eu&pagina=2).
const opcional = (schema) => z.preprocess((v) => (v === "" ? undefined : v), schema.optional());
const filtrosSchema = z.object({
  busca: opcional(z.string().trim().max(100, "Busca muito longa.")),
  status_id: opcional(id("Status inválido.")),
  tipo: opcional(z.enum(TIPOS_STATUS, { message: "Tipo de status inválido." })),
  situacao: opcional(z.enum(["ativos", "encerrados"], { message: "Use situacao=ativos ou situacao=encerrados." })),
  prioridade_id: opcional(id("Prioridade inválida.")),
  categoria_id: opcional(id("Categoria inválida.")),
  setor_id: opcional(id("Setor inválido.")),
  responsavel: opcional(z.union([z.enum(["nenhum", "eu"]), id()], { errorMap: () => ({ message: "Responsável inválido." }) })),
  alta: opcional(z.enum(["1"])).transform((v) => v === "1"),
  pagina: z.coerce.number().int().min(1, "Página inválida.").default(1),
  por_pagina: z.coerce.number().int().min(5).max(100, "No máximo 100 por página.").default(20)
});

router.get("/", validate({ query: filtrosSchema }), controller.listar);
router.get("/:id", comId, controller.buscarPorId);
router.get("/:id/historico", comId, controller.historico);
router.post("/", validate({ body: criarSchema }), controller.criar);
router.patch("/:id", validate({ params: idParam, body: atualizarSchema }), controller.atualizar);
router.post("/:id/assumir", somenteAdmin, comId, controller.assumir);
router.post("/:id/cancelar", comId, controller.cancelar);
router.post("/:id/reabrir", validate({ params: idParam, body: reabrirSchema }), controller.reabrir);
router.post("/:id/observacoes", validate({ params: idParam, body: observacaoSchema }), controller.comentar);
router.delete("/:id", somenteAdmin, comId, controller.excluir);

module.exports = router;
