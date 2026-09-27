import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base: the same build works on GitHub Pages under any repo name.
  base: "./",
  plugins: [react()],
});
