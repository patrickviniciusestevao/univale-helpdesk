const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { unauthorized, forbidden } = require("./errors");

// Perfis de acesso (fonte única; o frontend usa os mesmos nomes).
const PERFIS = { USUARIO: "usuario", ADMIN: "admin" };

function gerarTokenAcesso(usuario) {
  return jwt.sign(
    { sub: usuario.id, nome: usuario.nome, perfil: usuario.perfil, trocar_senha: Boolean(usuario.trocar_senha) },
    env.auth.jwtSecret,
    { expiresIn: env.auth.acessoExpiraEm, algorithm: "HS256" }
  );
}

/**
 * Exige login: lê "Authorization: Bearer <token>", confere a assinatura e a validade
 * e coloca o usuário em req.usuario = { id, nome, perfil, trocar_senha }.
 */
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) return next(unauthorized());

  try {
    // algorithms fixo: não aceita token assinado de outro jeito (ex.: "none").
    const dados = jwt.verify(token, env.auth.jwtSecret, { algorithms: ["HS256"] });
    req.usuario = { id: Number(dados.sub), nome: dados.nome, perfil: dados.perfil, trocar_senha: dados.trocar_senha };
    return next();
  } catch (erro) {
    const expirado = erro.name === "TokenExpiredError";
    return next(unauthorized(expirado ? "Sessão expirada." : "Sessão inválida. Faça login novamente.", { code: expirado ? "TOKEN_EXPIRADO" : "TOKEN_INVALIDO" }));
  }
}

// Quem ainda está com a senha temporária só pode usar as rotas de /api/auth (para trocá-la).
function exigirSenhaTrocada(req, res, next) {
  if (req.usuario?.trocar_senha) return next(forbidden("Troque sua senha temporária para continuar.", { code: "TROCAR_SENHA" }));
  return next();
}

// Exige um dos perfis. Uso: router.post("/", exigirPerfil(PERFIS.ADMIN), ...)
function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario?.perfil)) return next(forbidden());
    return next();
  };
}

module.exports = { PERFIS, gerarTokenAcesso, autenticar, exigirSenhaTrocada, exigirPerfil };
