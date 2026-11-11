import { cn } from "@/lib/cn";

// Tabela densa para computador. No celular, as telas mostram cartões no lugar.

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-[15px]", className)}>{children}</table>
    </div>
  );
}

export function Th({ className, ...props }) {
  return (
    <th
      className={cn("border-b border-borda bg-superficie-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-texto-suave", className)}
      {...props}
    />
  );
}

export function Tr({ onClick, className, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={cn("border-b border-borda last:border-0 even:bg-superficie-2/40", onClick && "cursor-pointer hover:bg-primaria-suave", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
