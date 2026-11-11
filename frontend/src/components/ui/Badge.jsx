import { cn } from "@/lib/cn";

const tons = {
  neutro: "bg-superficie-2 text-texto-suave",
  primaria: "bg-primaria-suave text-primaria",
  info: "bg-info-suave text-info",
  sucesso: "bg-sucesso-suave text-sucesso",
  aviso: "bg-aviso-suave text-aviso",
  perigo: "bg-perigo-suave text-perigo"
};

export function Badge({ tom = "neutro", ponto = true, className, children }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tons[tom], className)}
    >
      {ponto && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
