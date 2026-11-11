import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

const tons = {
  primaria: "bg-primaria-suave text-primaria",
  info: "bg-info-suave text-info",
  sucesso: "bg-sucesso-suave text-sucesso",
  aviso: "bg-aviso-suave text-aviso",
  perigo: "bg-perigo-suave text-perigo"
};

// Cartão de indicador. Com "para", vira link (ex.: abre a lista já filtrada).
export function StatCard({ rotulo, valor, icone: Icone, tom = "primaria", para, carregando }) {
  const conteudo = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-texto-suave">{rotulo}</span>
        {Icone && (
          <span className={cn("flex size-9 items-center justify-center rounded-lg", tons[tom])}>
            <Icone className="size-5" aria-hidden />
          </span>
        )}
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">
        {carregando ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-superficie-2" /> : valor}
      </div>
    </>
  );

  const classes = "block rounded-xl border border-borda bg-superficie p-5 shadow-cartao";
  return para ? (
    <Link to={para} className={cn(classes, "transition-colors hover:border-primaria")}>
      {conteudo}
    </Link>
  ) : (
    <div className={classes}>{conteudo}</div>
  );
}
