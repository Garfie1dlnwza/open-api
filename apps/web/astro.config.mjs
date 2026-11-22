import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Locale list mirrors LOCALES in @thai-open-api/schema; keep them in sync.
// Where the playground Worker lives; the only third-party origin the pages may call.
const playgroundOrigin = process.env.PUBLIC_PLAYGROUND_URL ? new URL(process.env.PUBLIC_PLAYGROUND_URL).origin : "";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "http://localhost:4321",
  integrations: [react()],
  // Astro hashes its own inline scripts and styles, so no 'unsafe-inline' is needed.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        `connect-src 'self' ${playgroundOrigin}`.trim(),
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
      ],
      // Server-rendered style="..." attributes (bar widths, animation delays) need this. Attributes only:
      // <style> elements stay locked to Astro's hashes.
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }] },
    },
  },
  i18n: {
    defaultLocale: "th",
    locales: ["th", "en"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
});
