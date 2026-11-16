import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), flowbiteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  // in local dev (npm run dev), send /apis calls to the dockerized backend on port 8080
  // so the frontend can use relative urls like fetch('/apis/profile/me') everywhere
  server: {
    proxy: {
      "/apis": "http://localhost:8080",
    },
  },
});
