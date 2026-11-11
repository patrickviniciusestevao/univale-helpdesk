import { PERFIS } from "@/lib/perfis";

// Tipos de status que as regras usam (cadastro de status). O nome do status pode ser qualquer um.
export const TIPO_STATUS = { ABERTO: "aberto", ANDAMENTO: "andamento", RESOLVIDO: "resolvido", CANCELADO: "cancelado" };
const ENCERRADOS = [TIPO_STATUS.RESOLVIDO, TIPO_STATUS.CANCELADO];

// Mesmo prazo do backend (chamados.service.js).
export const PRAZO_REABERTURA_DIAS = 7;

export function dentroDoPrazoDeReabertura(chamado) {
  if (!chamado.data_encerramento) return true;
  return (Date.now() - new Date(chamado.data_encerramento)) / (24 * 60 * 60 * 1000) <= PRAZO_REABERTURA_DIAS;
}

/**
 * O que o usuário logado pode fazer com um chamado. Só decide quais botões aparecem:
 * a API confere as mesmas regras de novo (chamados.service.js).
 */
export function permissoesChamado(chamado, usuario) {
  const admin = usuario.perfil === PERFIS.ADMIN;
  const dono = chamado.usuario_solicitante_id === usuario.id;
  const tipo = chamado.status_tipo;
  const aberto = tipo === TIPO_STATUS.ABERTO;
  const encerrado = ENCERRADOS.includes(tipo);

  return {
    editar: admin || (dono && aberto),
    editarCamposDaEquipe: admin, // status, setor, responsável
    cancelar: tipo !== TIPO_STATUS.CANCELADO && (admin || (dono && aberto)),
    excluir: admin,
    assumir: admin && !encerrado && (chamado.usuario_responsavel_id !== usuario.id || aberto),
    comentar: admin || tipo !== TIPO_STATUS.CANCELADO,
    observacaoInterna: admin,
    reabrir: tipo === TIPO_STATUS.RESOLVIDO && (admin || (dono && dentroDoPrazoDeReabertura(chamado)))
  };
}
