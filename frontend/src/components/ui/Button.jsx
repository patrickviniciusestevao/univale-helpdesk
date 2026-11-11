import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variantes = {
  primaria: "bg-primaria text-primaria-contraste hover:bg-primaria-hover shadow-cartao",
  secundaria: "bg-superficie text-texto border border-borda hover:bg-superficie-2 shadow-cartao",
  fantasma: "text-texto-suave hover:bg-superficie-2 hover:text-texto",
  perigo: "bg-perigo text-white hover:opacity-90 shadow-cartao",
  "perigo-fantasma": "text-perigo hover:bg-perigo-suave"
};

const tamanhos = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-[15px] gap-2",
  icone: "h-10 w-10 justify-center"
};

// Classes do botão, para usar também em <Link> com cara de botão.
export function classesBotao({ variante = "primaria", tamanho = "md", className } = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria",
    "disabled:pointer-events-none disabled:opacity-60 cursor-pointer",
    variantes[variante],
    tamanhos[tamanho],
    className
  );
}

export function Button({ variante = "primaria", tamanho = "md", carregando = false, className, children, disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={classesBotao({ variante, tamanho, className })}
      {...props}
    >
      {carregando && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
