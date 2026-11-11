// env primeiro: carrega o .env antes de qualquer módulo que leia process.env (B-11).
const env = require("./config/env");
const app = require("./app");
const { testarConexao } = require("./config/db");
const { limparSessoesAntigas } = require("./modules/auth/auth.service");

const UM_DIA = 24 * 60 * 60 * 1000;

// Faxina das sessões antigas: ao subir e depois uma vez por dia. Erro aqui não derruba a API.
async function faxinaSessoes() {
  try {
    const apagadas = await limparSessoesAntigas();
    if (apagadas) console.log(`Faxina: ${apagadas} sessões antigas apagadas.`);
  } catch (erro) {
    console.error("Faxina de sessões falhou:", erro.message);
  }
}

async function iniciarServidor() {
  try {
    await testarConexao();
    console.log("Conexão com o MySQL estabelecida com sucesso.");
  } catch (erro) {
    console.error(`Não foi possível conectar ao MySQL (${erro.code || erro.message}).`);
    console.error("Confira DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME em backend/.env.");
    process.exit(1);
  }

  app.listen(env.porta, () => {
    console.log(`API HelpDesk rodando em http://localhost:${env.porta}/api`);
  });

  faxinaSessoes();
  setInterval(faxinaSessoes, UM_DIA).unref();
}

iniciarServidor();
