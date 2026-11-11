import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

/**
 * Navegação entre páginas de uma lista: "Mostrando 21–40 de 57" + anterior/próxima.
 * Some quando tudo cabe numa página só.
 */
export function Paginacao({ pagina, paginas, total, porPagina, onMudar, carregando }) {
  if (paginas <= 1) return null;
  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Paginação">
      <p className="text-sm text-texto-suave tabular-nums">
        Mostrando {inicio}–{fim} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variante="secundaria" tamanho="sm" disabled={pagina <= 1 || carregando} onClick={() => onMudar(pagina - 1)}>
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </Button>
        <span className="text-sm text-texto-suave tabular-nums">
          {pagina} / {paginas}
        </span>
        <Button variante="secundaria" tamanho="sm" disabled={pagina >= paginas || carregando} onClick={() => onMudar(pagina + 1)}>
          Próxima
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
