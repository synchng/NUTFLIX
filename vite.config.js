import { defineConfig } from "vite";
import reactTailwind from "@tailwindcss/vite";
export default defineConfig({
  plugins: [reactTailwind()],
  server: { watch: { ignored: ["**/data/**"] } },
});
