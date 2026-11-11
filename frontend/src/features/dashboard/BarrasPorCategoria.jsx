import { Link } from "react-router-dom";
import { plural } from "@/lib/format";

/**
 * Barras horizontais: chamados por categoria. Feito só com HTML + Tailwind (sem biblioteca de gráficos).
 * - Uma série só → uma cor (primária do tema), sem legenda: o título do card diz o que é.
 * - Barra fina, presa à esquerda (base), ponta arredondada só no fim do valor.
 * - Número e nome em cor de texto (nunca na cor da barra); cada linha é um link para a lista filtrada.
 * - Passar o mouse destaca a linha e mostra o detalhe (title); a própria lista com números serve de "tabela".
 */
export function BarrasPorCategoria({ dados }) {
  if (dados.length === 0) return <p className="py-6 text-center text-sm text-texto-suave">Nenhum chamado ainda.</p>;

  const maior = Math.max(...dados.map((d) => d.total));
  const soma = dados.reduce((s, d) => s + d.total, 0);

  return (
    <ul className="flex flex-col gap-1" aria-label="Chamados por categoria">
      {dados.map((d) => {
        const porcento = Math.round((d.total / soma) * 100);
        return (
          <li key={d.id}>
            <Link
              to={`/chamados?categoria=${d.id}`}
              title={`${d.nome}: ${plural(d.total, "chamado")} (${porcento}%)`}
              className="group -mx-2 block rounded-lg px-2 py-2 hover:bg-superficie-2"
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{d.nome}</span>
                <span className="shrink-0 tabular-nums text-texto-suave">
                  <span className="font-semibold text-texto">{d.total}</span> · {porcento}%
                </span>
              </div>
              <div className="h-2 w-full rounded-r bg-superficie-2 group-hover:bg-borda/60">
                <div
                  className="h-full rounded-r bg-primaria transition-[width] duration-500"
                  style={{ width: `${Math.max((d.total / maior) * 100, 2)}%` }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
