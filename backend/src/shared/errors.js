const { ZodError } = require("zod");

// Erro "esperado" da aplicação: já sabe qual status HTTP e mensagem devolver.
class AppError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (message, extra) => new AppError(400, message, extra);
const unauthorized = (message = "Faça login para continuar.", extra) => new AppError(401, message, extra);
const forbidden = (message = "Você não tem permissão para esta ação.", extra) => new AppError(403, message, extra);
const notFound = (message = "Registro não encontrado.", extra) => new AppError(404, message, extra);
const conflict = (message, extra) => new AppError(409, message, extra);

// Rota que não existe: responde 404 no mesmo formato dos outros erros (B-16).
function rotaNaoEncontrada(req, res) {
  res.status(404).json({ error: { message: `Rota não encontrada: ${req.method} ${req.originalUrl}` } });
}

// Tratador global: todo erro lançado nas rotas termina aqui e sai no formato { error: { message, code?, details? } }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code, details: err.details } });
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message }));
    return res.status(400).json({ error: { message: details[0].mensagem, code: "VALIDACAO", details } });
  }

  // Corpo grande demais (limite em app.js).
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: { message: "Conteúdo grande demais para enviar." } });
  }

  // JSON mal formado no corpo da requisição.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { message: "O corpo da requisição não é um JSON válido." } });
  }

  // Nome repetido em cadastro (chave única do banco).
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: { message: "Já existe um registro com esse valor." } });
  }

  // Erro inesperado: detalhe só no console do servidor, nunca para o cliente.
  console.error(err);
  return res.status(500).json({ error: { message: "Erro interno no servidor." } });
}

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict, rotaNaoEncontrada, errorHandler };
