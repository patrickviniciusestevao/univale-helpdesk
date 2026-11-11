// Respostas de sucesso num formato único: { data, meta?, message? }.

function ok(res, data, { meta, message } = {}) {
  return res.status(200).json({ data, meta, message });
}

function created(res, data, { message } = {}) {
  return res.status(201).json({ data, message });
}

/**
 * Express 4 não captura erro de função async sozinho.
 * wrapAll embrulha cada função do controller para mandar qualquer erro ao errorHandler.
 */
function wrapAll(controller) {
  const embrulhado = {};
  for (const [nome, fn] of Object.entries(controller)) {
    embrulhado[nome] = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  }
  return embrulhado;
}

// Atualização parcial: só sobrescreve os campos que vieram (undefined = "não mexer").
function mergeDefined(existente, novos) {
  const resultado = { ...existente };
  for (const [campo, valor] of Object.entries(novos)) {
    if (valor !== undefined) resultado[campo] = valor;
  }
  return resultado;
}

module.exports = { ok, created, wrapAll, mergeDefined };
