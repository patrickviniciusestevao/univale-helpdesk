import { Badge } from "@/components/ui/Badge";

// A cor vem do cadastro (status_cor / prioridade_cor), escolhida pelo administrador (B-25).

export function StatusBadge({ nome, cor }) {
  return <Badge tom={cor ?? "neutro"}>{nome}</Badge>;
}

export function PrioridadeBadge({ nome, cor }) {
  return (
    <Badge tom={cor ?? "neutro"} ponto={false}>
      {nome}
    </Badge>
  );
}
