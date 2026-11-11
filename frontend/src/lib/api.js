// Único lugar que conversa com a API por HTTP. As telas usam os hooks dos arquivos features/*/api.js.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(message, status, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code; // ex.: "TOKEN_EXPIRADO", "TROCAR_SENHA", "VALIDACAO"
    this.details = details; // [{ campo, mensagem }] nos erros de validação
  }
}

// ---------------------------------------------------------------------------
// Sessão
// O token de acesso fica SÓ na memória (some ao recarregar). Para voltar, o navegador manda
// o cookie httpOnly da sessão em /auth/refresh — que o JavaScript não consegue ler.
// ---------------------------------------------------------------------------
let tokenAcesso = null;
let aoExpirarSessao = () => {};
let renovacaoEmAndamento = null;

export function definirToken(token) {
  tokenAcesso = token;
}

// O AuthProvider registra aqui o que fazer quando a sessão acabar de vez (volta para o login).
export function quandoSessaoExpirar(fn) {
  aoExpirarSessao = fn;
}

async function requisitar(caminho, { method = "GET", body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (tokenAcesso) headers.Authorization = `Bearer ${tokenAcesso}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include" // envia/recebe o cookie da sessão
    });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Ela está rodando?", 0);
  }

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ApiError(corpo.error?.message || `Erro ${resposta.status} na API.`, resposta.status, corpo.error ?? {});
  }
  return corpo;
}

/**
 * Pede um novo token usando o cookie. Se várias telas pedirem ao mesmo tempo, todas esperam
 * a mesma renovação (o servidor troca o cookie a cada renovação; duas em paralelo derrubariam a sessão).
 */
export function renovarSessao() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = requisitar("/auth/refresh", { method: "POST" })
      .then((r) => {
        tokenAcesso = r.data.token;
        return r.data; // { token, usuario }
      })
      .finally(() => {
        renovacaoEmAndamento = null;
      });
  }
  return renovacaoEmAndamento;
}

/**
 * Faz a requisição e devolve o corpo { data, message }.
 * Token vencido (401)? Renova a sessão e tenta mais uma vez. Se não der, avisa que a sessão acabou.
 */
export async function api(caminho, opcoes) {
  try {
    return await requisitar(caminho, opcoes);
  } catch (erro) {
    if (erro.status !== 401 || caminho.startsWith("/auth/")) throw erro;
    try {
      await renovarSessao();
    } catch {
      tokenAcesso = null;
      aoExpirarSessao();
      throw erro;
    }
    return requisitar(caminho, opcoes);
  }
}
