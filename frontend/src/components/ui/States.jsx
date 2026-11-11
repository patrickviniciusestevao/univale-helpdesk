import { Loader2, AlertCircle, CheckCircle2, Info, AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function LoadingState({ texto = "Carregando..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-texto-suave">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{texto}</span>
    </div>
  );
}

export function EmptyState({ icone: Icone = Inbox, titulo, descricao, acao }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-superficie-2 text-texto-suave">
        <Icone className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 max-w-sm text-sm text-texto-suave">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

const tonsAlerta = {
  info: ["bg-info-suave text-info", Info],
  sucesso: ["bg-sucesso-suave text-sucesso", CheckCircle2],
  aviso: ["bg-aviso-suave text-aviso", AlertTriangle],
  perigo: ["bg-perigo-suave text-perigo", AlertCircle]
};

export function Alert({ tom = "info", titulo, children, acao, className }) {
  const [classes, Icone] = tonsAlerta[tom];
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-lg px-4 py-3 text-sm", classes, className)}>
      <Icone className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={cn(titulo && "mt-0.5")}>{children}</div>}
      </div>
      {acao}
    </div>
  );
}
