import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Locale list mirrors LOCALES in @thai-open-api/schema; keep them in sync.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "http://localhost:4321",
  integrations: [react()],
  i18n: {
    defaultLocale: "th",
    locales: ["th", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
});
