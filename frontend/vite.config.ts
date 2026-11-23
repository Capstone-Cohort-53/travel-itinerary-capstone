import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), flowbiteReact()],
  resolve: {
    tsconfigPaths: true,
    // always use one copy of React, so hooks never see two
    dedupe: ["react", "react-dom"],
  },
  // pre-bundle these at startup; when Vite discovers a package mid-session it
  // re-bundles and the browser can end up with two copies of React ("Invalid hook call")
  optimizeDeps: {
    include: [
      "leaflet",
      "react-leaflet",
      "@react-oauth/google",
      "flowbite-react",
      "flowbite-react/store/init",
      "@tanstack/react-form",
      "@tanstack/react-form-remix",
      "uuid",
      "zod",
    ],
  },
  // in local dev (npm run dev), send /apis calls to the dockerized backend on port 8080
  // so the frontend can use relative urls like fetch('/apis/profile/me') everywhere
  server: {
    proxy: {
      "/apis": "http://localhost:8080",
    },
  },
});
