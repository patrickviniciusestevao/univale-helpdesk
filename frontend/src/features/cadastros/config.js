import { Tags, Gauge, CircleDot, Building2 } from "lucide-react";

// Mesmas listas do backend (backend/src/modules/cadastros/cadastros.tipos.js).

// Cores do tema: o valor é o "tom" do Badge.
export const CORES = [
  { valor: "neutro", rotulo: "Cinza" },
  { valor: "primaria", rotulo: "Roxo" },
  { valor: "info", rotulo: "Azul" },
  { valor: "sucesso", rotulo: "Verde" },
  { valor: "aviso", rotulo: "Amarelo" },
  { valor: "perigo", rotulo: "Vermelho" }
];

// Tipo do status: o que ele significa para as regras do sistema.
export const TIPOS_STATUS = [
  { valor: "aberto", rotulo: "Aberto", descricao: "Ainda não começou. O solicitante pode editar e cancelar." },
  { valor: "andamento", rotulo: "Em andamento", descricao: "A equipe está atendendo." },
  { valor: "resolvido", rotulo: "Resolvido", descricao: "Encerrado com solução." },
  { valor: "cancelado", rotulo: "Cancelado", descricao: 'Encerrado sem solução. Usado pelo botão "Cancelar chamado".' }
];

export const rotuloTipoStatus = (valor) => TIPOS_STATUS.find((t) => t.valor === valor)?.rotulo ?? valor;

// Abas da tela de cadastros.
export const ABAS = [
  { tipo: "categorias", rotulo: "Categorias", singular: "categoria", icone: Tags, descricao: "Tipo do problema: Hardware, Software, Rede..." },
  { tipo: "prioridades", rotulo: "Prioridades", singular: "prioridade", icone: Gauge, descricao: "Urgência do chamado. O maior nível é a alta prioridade." },
  { tipo: "status", rotulo: "Status", singular: "status", icone: CircleDot, descricao: "Etapas do atendimento. Um deles é o inicial, com que todo chamado nasce." },
  { tipo: "setores", rotulo: "Setores", singular: "setor", icone: Building2, descricao: "Áreas da instituição: Financeiro, Secretaria, TI..." }
];
