// Toda formatação de datas e textos passa por aqui.

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

export function formatarData(valor) {
  return valor ? formatoData.format(new Date(valor)) : "—";
}

export function formatarDataHora(valor) {
  return valor ? formatoDataHora.format(new Date(valor)) : "—";
}

// "há 5 minutos", "há 2 dias"...
const relativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const UNIDADES = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60]
];

export function tempoRelativo(valor) {
  if (!valor) return "—";
  const segundos = (new Date(valor) - Date.now()) / 1000;
  for (const [unidade, tamanho] of UNIDADES) {
    if (Math.abs(segundos) >= tamanho) return relativo.format(Math.round(segundos / tamanho), unidade);
  }
  return "agora";
}

export function plural(quantidade, singular, pluralTexto = `${singular}s`) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}
