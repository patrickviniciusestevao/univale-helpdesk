// Configuração dos cadastros auxiliares: tipo na URL → tabela, colunas, ordem da lista e textos.
// O nome da tabela e das colunas sai SEMPRE desta lista fixa (nunca do usuário), por isso pode entrar na SQL.

// Cores do tema (frontend/src/index.css). Guardamos o nome, não o código da cor: funciona no claro e no escuro.
const CORES = ["neutro", "primaria", "info", "sucesso", "aviso", "perigo"];

// Tipo do status: o que ele significa para as regras (migração 003).
//   aberto    → ainda não começou: o solicitante pode editar e cancelar
//   andamento → a equipe está atendendo
//   resolvido → encerrado com solução
//   cancelado → encerrado sem solução (destino do botão "Cancelar chamado")
const TIPOS_STATUS = ["aberto", "andamento", "resolvido", "cancelado"];

const TIPOS = {
  categorias: {
    tabela: "categorias",
    rotulo: "Categoria",
    genero: "a",
    maxNome: 50,
    colunas: ["id", "nome", "ativo"],
    ordenacao: "nome"
  },
  prioridades: {
    tabela: "prioridades",
    rotulo: "Prioridade",
    genero: "a",
    maxNome: 20,
    colunas: ["id", "nome", "nivel", "cor", "ativo"],
    ordenacao: "nivel, id"
  },
  status: {
    tabela: "status_chamados",
    rotulo: "Status",
    genero: "o",
    maxNome: 30,
    colunas: ["id", "nome", "tipo", "inicial", "cor", "ordem", "ativo"],
    ordenacao: "ordem, id"
  },
  setores: {
    tabela: "setores",
    rotulo: "Setor",
    genero: "o",
    maxNome: 60,
    colunas: ["id", "nome", "ativo"],
    ordenacao: "nome"
  }
};

module.exports = { CORES, TIPOS_STATUS, TIPOS };
