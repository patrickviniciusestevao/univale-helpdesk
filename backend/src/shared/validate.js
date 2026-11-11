const { z } = require("zod");

/**
 * Middleware de validação: confere body/params/query com schemas Zod.
 * Se passar, troca o valor original pelo valor já limpo (trim, números convertidos...).
 * Se falhar, o ZodError vai para o errorHandler (400).
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      for (const parte of ["params", "query", "body"]) {
        if (schemas[parte]) req[parte] = schemas[parte].parse(req[parte] ?? {});
      }
      next();
    } catch (erro) {
      next(erro);
    }
  };
}

// Peças reutilizadas pelos schemas dos módulos.
// Id numérico positivo; aceita "3" ou 3 (vindo de URL ou de formulário).
const id = (mensagem = "Id inválido.") =>
  z.coerce.number({ invalid_type_error: mensagem }).int(mensagem).positive(mensagem);

const idParam = z.object({ id: id() });

const textoObrigatorio = (rotulo, max) =>
  z
    .string({ required_error: `Informe ${rotulo}.`, invalid_type_error: `Informe ${rotulo}.` })
    .trim()
    .min(1, `Informe ${rotulo}.`)
    .max(max, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} deve ter no máximo ${max} caracteres.`);

module.exports = { validate, id, idParam, textoObrigatorio };
