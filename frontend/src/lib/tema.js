import { useState } from "react";

// Tema claro/escuro: classe .dark no <html> + escolha guardada no navegador.
export function useTema() {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains("dark"));

  function alternarTema() {
    const novo = !escuro;
    document.documentElement.classList.toggle("dark", novo);
    try {
      localStorage.setItem("tema", novo ? "escuro" : "claro");
    } catch {
      // navegador sem armazenamento: o tema só vale até recarregar
    }
    setEscuro(novo);
  }

  return { escuro, alternarTema };
}
