const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const env = require("./config/env");

const authRoutes = require("./modules/auth/auth.routes");
const chamadosRoutes = require("./modules/chamados/chamados.routes");
const cadastrosRoutes = require("./modules/cadastros/cadastros.routes");
const usuariosRoutes = require("./modules/usuarios/usuarios.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const { autenticar, exigirSenhaTrocada, exigirPerfil, PERFIS } = require("./shared/auth");
const { rotaNaoEncontrada, errorHandler } = require("./shared/errors");

const app = express();

// Atrás de proxy (produção): usa o IP real do visitante, não o do proxy.
if (env.trustProxy) app.set("trust proxy", env.trustProxy);

// Cabeçalhos de segurança (esconde "X-Powered-By: Express", impede a API de ser aberta dentro de iframe, etc.).
app.use(helmet());
// Só o frontend pode chamar a API pelo navegador, e com cookie (credentials) para a sessão.
app.use(cors({ origin: env.frontendUrl, credentials: true }));
// Corpo JSON de no máximo 100 KB (um chamado com descrição longa tem bem menos que isso).
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ data: { status: "ok" }, message: "API HelpDesk funcionando." }));

// Públicas: login, renovar sessão, sair. As demais exigem login e senha já trocada.
app.use("/api/auth", authRoutes);
app.use("/api/chamados", autenticar, exigirSenhaTrocada, chamadosRoutes);
app.use("/api/cadastros", autenticar, exigirSenhaTrocada, cadastrosRoutes);
app.use("/api/dashboard", autenticar, exigirSenhaTrocada, dashboardRoutes);
app.use("/api/usuarios", autenticar, exigirSenhaTrocada, exigirPerfil(PERFIS.ADMIN), usuariosRoutes);

app.use(rotaNaoEncontrada);
app.use(errorHandler);

module.exports = app;
