const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Custo do bcrypt: cada +1 dobra o tempo para gerar/conferir (e para um atacante testar senhas).
const CUSTO_BCRYPT = 10;

// Hash qualquer, conferido quando o e-mail do login não existe: a resposta demora o mesmo tempo
// e ninguém descobre quais e-mails estão cadastrados medindo o tempo.
const HASH_FALSO = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), CUSTO_BCRYPT);

function gerarHash(senha) {
  return bcrypt.hash(senha, CUSTO_BCRYPT);
}

function conferir(senha, hash) {
  return bcrypt.compare(senha, hash);
}

// Sem letras/números que se confundem (0/O, 1/l/I): a senha é ditada ou copiada para a pessoa.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/**
 * Senha temporária aleatória (10 caracteres, com letra e número), mostrada uma vez ao administrador.
 * A pessoa troca no primeiro login.
 */
function gerarSenhaTemporaria(tamanho = 10) {
  let senha = "";
  do {
    senha = Array.from({ length: tamanho }, () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join("");
  } while (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha));
  return senha;
}

module.exports = { CUSTO_BCRYPT, HASH_FALSO, gerarHash, conferir, gerarSenhaTemporaria };
