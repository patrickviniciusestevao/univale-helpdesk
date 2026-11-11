// Carrega o .env uma única vez, antes de qualquer outro módulo (resolve B-11).
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Sem segredo do JWT o login não é seguro: melhor não subir do que subir com um valor fraco.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Defina JWT_SECRET (mínimo 32 caracteres) em backend/.env. Para gerar um:");
  console.error("  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}

const producao = process.env.NODE_ENV === "production";

// Em produção, avisos do que costuma ficar esquecido (não impedem de subir).
if (producao) {
  if (!process.env.FRONTEND_URL?.startsWith("https://")) {
    console.warn("[atenção] FRONTEND_URL deveria ser o endereço https do frontend em produção.");
  }
  if (process.env.DB_USER === "root") {
    console.warn("[atenção] Em produção, conecte com um usuário próprio do app, não com root (ver database/schema_completo.sql, parte 5).");
  }
}

module.exports = {
  porta: Number(process.env.PORT || 3000),
  producao,
  // Endereço do frontend: única origem aceita pelo CORS (necessário para enviar o cookie de sessão).
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  // Atrás de um proxy (Nginx, Render, Railway...): quantos proxies confiar para descobrir o IP real
  // do visitante (usado no limite de tentativas de login). Sem proxy: 0.
  trustProxy: Number(process.env.TRUST_PROXY || 0),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    // Sem senha "escondida" no código (B-10): o que vale é o que está no .env.
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    // Token de acesso curto; a sessão continua pelo refresh token (cookie).
    acessoExpiraEm: process.env.JWT_EXPIRA_EM || "15m",
    sessaoDias: Number(process.env.SESSAO_DIAS || 7)
  }
};
