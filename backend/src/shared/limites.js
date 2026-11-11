const { rateLimit } = require("express-rate-limit");

// Limite de tentativas de login (contra "chutar" senhas).
// Resposta no mesmo formato dos outros erros: { error: { message, code } }.
function responder(mensagem) {
  return (req, res) => res.status(429).json({ error: { message: mensagem, code: "MUITAS_TENTATIVAS" } });
}

const QUINZE_MINUTOS = 15 * 60 * 1000;

/**
 * Por IP + e-mail: 10 tentativas ERRADAS a cada 15 minutos (as certas não contam).
 * Por que não só por IP: num laboratório da Univale muitos alunos saem pelo mesmo IP;
 * um aluno errando a senha não pode bloquear a turma inteira.
 */
const limiteLoginPorConta = rateLimit({
  windowMs: QUINZE_MINUTOS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email ?? "").trim().toLowerCase()}`,
  handler: responder("Muitas tentativas de login com este e-mail. Aguarde 15 minutos e tente de novo.")
});

// Por IP: teto maior, contra quem testa muitos e-mails diferentes a partir da mesma máquina.
const limiteLoginPorIp = rateLimit({
  windowMs: QUINZE_MINUTOS,
  limit: 100,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: responder("Muitas tentativas de login a partir desta rede. Aguarde alguns minutos e tente de novo.")
});

module.exports = { limitesLogin: [limiteLoginPorIp, limiteLoginPorConta] };
