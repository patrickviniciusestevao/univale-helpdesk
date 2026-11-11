import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/components/ui/Button" em vez de "../../../components/ui/Button"
    alias: { "@": path.resolve(import.meta.dirname, "src") }
  },
  server: { port: 5173 }
});
