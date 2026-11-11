import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/**
 * Janela sobre a página. Fecha no X, no Esc e clicando fora.
 * No celular ocupa a parte de baixo da tela; no computador fica centralizada.
 */
export function Modal({ aberto, onFechar, titulo, descricao, rodape, tamanho = "md", children }) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden"; // página de trás não rola
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-borda bg-superficie shadow-xl animate-entrar sm:rounded-2xl",
          { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" }[tamanho]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-borda px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            {descricao && <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>}
          </div>
          <Button variante="fantasma" tamanho="icone" className="-mr-2 -mt-1 size-9" onClick={onFechar} aria-label="Fechar">
            <X className="size-5" />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {rodape && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-borda px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
