import { Headset, ShieldCheck, Ticket, Clock } from "lucide-react";

const DESTAQUES = [
  { icone: Ticket, texto: "Abra chamados e acompanhe cada passo do atendimento." },
  { icone: Clock, texto: "Saiba quem está atendendo e o que já foi feito." },
  { icone: ShieldCheck, texto: "Acesso individual e seguro para cada pessoa." }
];

// Tela dividida: apresentação à esquerda (só no computador) e o formulário à direita.
export function AuthLayout({ titulo, descricao, children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primaria p-12 text-primaria-contraste lg:flex lg:flex-col">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
            <Headset className="size-6" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-semibold">Univale</p>
            <p className="text-sm opacity-80">Helpdesk</p>
          </div>
        </div>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">Suporte organizado, do pedido à solução.</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-start gap-3 opacity-90">
                <Icone className="mt-0.5 size-5 shrink-0" aria-hidden />
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primaria text-primaria-contraste">
              <Headset className="size-5" aria-hidden />
            </span>
            <span className="font-semibold">Univale Helpdesk</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          {descricao && <p className="mt-1.5 text-[15px] text-texto-suave">{descricao}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
