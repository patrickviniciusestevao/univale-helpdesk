import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Avisos rápidos no canto da tela. Uso: const toast = useToast(); toast.sucesso("Salvo!");
const ToastContext = createContext(null);

const tipos = {
  sucesso: ["text-sucesso", CheckCircle2],
  erro: ["text-perigo", AlertCircle],
  info: ["text-info", Info]
};

let proximoId = 1;

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const remover = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const mostrar = useCallback(
    (tipo, mensagem) => {
      const id = proximoId++;
      setAvisos((lista) => [...lista, { id, tipo, mensagem }]);
      setTimeout(() => remover(id), 4000);
    },
    [remover]
  );

  const toast = useMemo(
    () => ({
      sucesso: (m) => mostrar("sucesso", m),
      erro: (m) => mostrar("erro", m),
      info: (m) => mostrar("info", m)
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:w-96" aria-live="polite">
        {avisos.map(({ id, tipo, mensagem }) => {
          const [cor, Icone] = tipos[tipo];
          return (
            <div
              key={id}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 shadow-lg animate-entrar"
            >
              <Icone className={cn("mt-0.5 size-5 shrink-0", cor)} aria-hidden />
              <p className="flex-1 text-[15px]">{mensagem}</p>
              <button onClick={() => remover(id)} className="cursor-pointer text-texto-suave hover:text-texto" aria-label="Fechar aviso">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return toast;
}
