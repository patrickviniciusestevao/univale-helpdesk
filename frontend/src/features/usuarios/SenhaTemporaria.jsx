import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";

/**
 * Mostra a senha temporária gerada pelo sistema — só desta vez (no banco fica apenas o hash).
 * Botão copia um texto pronto para mandar à pessoa.
 */
export function SenhaTemporaria({ usuario, senha }) {
  const [copiado, setCopiado] = useState(false);
  const mensagem = `Olá, ${usuario.nome.split(" ")[0]}! Seu acesso ao Univale Helpdesk:\nE-mail: ${usuario.email}\nSenha temporária: ${senha}\nNo primeiro acesso você vai criar a sua própria senha.`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // navegador sem permissão de área de transferência: a pessoa copia manualmente
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tom="aviso" titulo="Anote ou copie agora">
        Por segurança, esta senha não será mostrada de novo. Se perder, use "Redefinir senha".
      </Alert>

      <div className="rounded-xl border border-borda bg-superficie-2 p-4">
        <p className="text-sm text-texto-suave">{usuario.nome}</p>
        <p className="text-sm text-texto-suave">{usuario.email}</p>
        <div className="mt-3 flex items-center gap-3">
          <KeyRound className="size-5 text-primaria" aria-hidden />
          <code className="text-2xl font-semibold tracking-wider select-all">{senha}</code>
        </div>
      </div>

      <Button variante="secundaria" onClick={copiar}>
        {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copiado ? "Copiado!" : "Copiar mensagem com o acesso"}
      </Button>
    </div>
  );
}
