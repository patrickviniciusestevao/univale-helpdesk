import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Ticket, Menu, X, Moon, Sun, Headset, ChevronDown, KeyRound, LogOut, Settings2, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTema } from "@/lib/tema";
import { PERFIS, ROTULO_PERFIL } from "@/lib/perfis";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";

// Itens do menu, por seção. "perfis" limita quem vê o item (sem "perfis" = todos).
const MENU = [
  { secao: "Menu", para: "/", rotulo: "Início", icone: LayoutDashboard, exato: true },
  { secao: "Menu", para: "/chamados", rotulo: "Meus chamados", icone: Ticket, perfis: [PERFIS.USUARIO] },
  { secao: "Menu", para: "/chamados", rotulo: "Chamados", icone: Ticket, perfis: [PERFIS.ADMIN] },
  { secao: "Administração", para: "/usuarios", rotulo: "Usuários", icone: Users, perfis: [PERFIS.ADMIN] },
  { secao: "Administração", para: "/cadastros", rotulo: "Cadastros", icone: Settings2, perfis: [PERFIS.ADMIN] }
];

const iniciais = (nome = "") =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

function MenuUsuario() {
  const { usuario, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e) => !ref.current?.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  return (
    <div ref={ref} className="relative ml-1">
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-superficie-2"
        aria-expanded={aberto}
        aria-label="Menu do usuário"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primaria-suave text-sm font-semibold text-primaria">
          {iniciais(usuario.nome)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium">{usuario.nome}</span>
          <span className="block text-xs text-texto-suave">{ROTULO_PERFIL[usuario.perfil]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-texto-suave sm:block" aria-hidden />
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-borda bg-superficie p-1.5 shadow-lg animate-entrar">
          <div className="border-b border-borda px-3 py-2.5">
            <p className="truncate font-medium">{usuario.nome}</p>
            <p className="truncate text-sm text-texto-suave">{usuario.email}</p>
            <p className="mt-1 text-xs text-texto-suave">
              {ROTULO_PERFIL[usuario.perfil]}
              {usuario.setor && ` · ${usuario.setor}`}
            </p>
          </div>
          <Link
            to="/trocar-senha"
            onClick={() => setAberto(false)}
            className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] hover:bg-superficie-2"
          >
            <KeyRound className="size-4 text-texto-suave" aria-hidden />
            Trocar senha
          </Link>
          <button onClick={sair} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] text-perigo hover:bg-perigo-suave">
            <LogOut className="size-4" aria-hidden />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primaria text-primaria-contraste">
        <Headset className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="font-semibold">Univale</p>
        <p className="text-xs text-texto-suave">Helpdesk</p>
      </div>
    </div>
  );
}

function Navegacao({ aoNavegar }) {
  const { usuario } = useAuth();
  const itens = MENU.filter((item) => !item.perfis || item.perfis.includes(usuario.perfil));
  const secoes = [...new Set(itens.map((i) => i.secao))];
  return (
    <nav className="mt-8 flex flex-col gap-6">
      {secoes.map((secao) => (
        <div key={secao} className="flex flex-col gap-1">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-texto-suave">{secao}</p>
          {itens
            .filter((i) => i.secao === secao)
            .map(({ para, rotulo, icone: Icone, exato }) => (
              <NavLink
                key={rotulo}
                to={para}
                end={exato}
                onClick={aoNavegar}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
                    isActive ? "bg-primaria-suave text-primaria" : "text-texto-suave hover:bg-superficie-2 hover:text-texto"
                  )
                }
              >
                <Icone className="size-5" aria-hidden />
                {rotulo}
              </NavLink>
            ))}
        </div>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { escuro, alternarTema } = useTema();

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Sidebar fixa no computador */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-borda bg-superficie p-4 lg:flex">
        <Marca />
        <Navegacao />
      </aside>

      {/* Menu deslizante no celular */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-superficie p-4 shadow-xl animate-entrar">
            <div className="flex items-center justify-between">
              <Marca />
              <Button variante="fantasma" tamanho="icone" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
                <X className="size-5" />
              </Button>
            </div>
            <Navegacao aoNavegar={() => setMenuAberto(false)} />
          </aside>
        </div>
      )}

      {/* Barra do topo */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-borda bg-superficie/85 px-4 backdrop-blur sm:px-6">
        <Button variante="fantasma" tamanho="icone" className="lg:hidden" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
          <Menu className="size-5" />
        </Button>
        <div className="lg:hidden">
          <Marca />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variante="fantasma" tamanho="icone" onClick={alternarTema} aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}>
            {escuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <MenuUsuario />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
