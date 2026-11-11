import { cn } from "@/lib/cn";

export function Card({ className, ...props }) {
  return <div className={cn("rounded-xl border border-borda bg-superficie shadow-cartao", className)} {...props} />;
}

export function CardHeader({ titulo, descricao, acoes, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-borda px-5 py-4", className)}>
      <div>
        <h2 className="text-base font-semibold">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>}
      </div>
      {acoes}
    </div>
  );
}
