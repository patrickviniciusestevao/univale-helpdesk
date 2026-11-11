import { useId, cloneElement } from "react";
import { cn } from "@/lib/cn";

// Classes comuns a Input, Select e Textarea.
const baseCampo =
  "w-full rounded-lg border border-borda bg-superficie px-3 text-[15px] text-texto placeholder:text-texto-suave " +
  "transition-colors focus:border-primaria focus:outline-none focus:ring-3 focus:ring-primaria-suave " +
  "disabled:opacity-60";
const invalidoCampo = "border-perigo focus:border-perigo focus:ring-perigo-suave";

export function Input({ invalido, className, ...props }) {
  return <input className={cn(baseCampo, "h-10", invalido && invalidoCampo, className)} {...props} />;
}

export function Select({ invalido, className, children, ...props }) {
  return (
    <select className={cn(baseCampo, "h-10 pr-8 cursor-pointer", invalido && invalidoCampo, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ invalido, className, ...props }) {
  return <textarea className={cn(baseCampo, "min-h-28 py-2.5 resize-y", invalido && invalidoCampo, className)} {...props} />;
}

// Caixa de seleção com texto ao lado (e explicação opcional embaixo).
export function Checkbox({ rotulo, descricao, className, ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", props.disabled && "cursor-not-allowed opacity-60", className)}>
      <input type="checkbox" className="mt-0.5 size-4 cursor-pointer accent-primaria" {...props} />
      <span>
        <span className="text-[15px] font-medium">{rotulo}</span>
        {descricao && <span className="block text-sm text-texto-suave">{descricao}</span>}
      </span>
    </label>
  );
}

/**
 * Rótulo + campo + mensagem de erro/dica. O id liga o rótulo ao campo (acessibilidade).
 * Uso: <Field rotulo="Título" erro={erros.titulo}><Input ... /></Field>
 */
export function Field({ rotulo, erro, dica, obrigatorio, className, children }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-perigo">*</span>}
      </label>
      {cloneElement(children, { id, invalido: Boolean(erro), "aria-invalid": Boolean(erro) || undefined })}
      {erro ? <p className="text-sm text-perigo">{erro}</p> : dica && <p className="text-sm text-texto-suave">{dica}</p>}
    </div>
  );
}
