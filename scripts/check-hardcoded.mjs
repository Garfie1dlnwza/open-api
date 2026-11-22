#!/usr/bin/env node
/**
 * Guards against hardcoded values. Fails (exit 1) when source code contains:
 *  - Thai text (user-facing strings belong in apps/web/src/i18n/messages or the catalog YAML)
 *  - colour literals or raw Tailwind palette colours (use the tokens in tokens.css)
 *  - storage keys written inline (use STORAGE in apps/web/src/config/site.ts)
 *  - route paths written inline (use ROUTES)
 *  - import.meta.env / process.env outside the config modules
 * Add `// check-hardcoded: ignore` to a line to allow it deliberately.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SCAN = ["apps/web/src", "apps/worker/src", "packages/schema/src", "scripts"];
const EXTENSIONS = /\.(ts|tsx|astro|mjs)$/;

/** Files where these literals are the whole point. */
const EXEMPT = [
  /^apps\/web\/src\/i18n\/messages\//,
  /\.test\.tsx?$/,
  /^packages\/schema\/src\/fixtures\.ts$/,
  /^apps\/web\/src\/config\//,
  /^scripts\/check-hardcoded\.mjs$/,
  /^apps\/worker\/src\/config\.ts$/,
];
const ENV_ALLOWED = [/^apps\/web\/src\/config\//, /^packages\/schema\/src\/node\.ts$/, /^scripts\//];

const ROUTE_PATHS = ["/apis", "/th", "/en", "/search-index.json", "/v1/playground"];
const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white";

const RULES = [
  { name: "Thai text (use t() and the messages files)", test: (l) => /[฀-๿]/.test(l) },
  {
    name: "colour literal (use a token from tokens.css)",
    test: (l) => /#[0-9a-fA-F]{3,8}\b/.test(l.replace(/&#\d+;|href="#|["'`]#[a-z-]+["'`]|\.\.\/#/g, "")) || /\b(rgba?|hsla?|oklch|oklab)\(/.test(l),
  },
  {
    name: "raw Tailwind palette colour (use a token like bg-surface, text-ink)",
    test: (l) => new RegExp(`\\b(bg|text|border|fill|stroke|ring|from|to|via|divide|outline|shadow)-(${PALETTE})(-\\d{2,3})?(/\\d+)?\\b`).test(l),
  },
  { name: "inline storage key (use STORAGE)", test: (l) => /(localStorage|sessionStorage|storage|store\(\)\?)\.(getItem|setItem|removeItem)\(\s*["'`]/.test(l) },
  { name: "inline route path (use ROUTES)", test: (l) => ROUTE_PATHS.some((p) => new RegExp(`["'\`]${p}["'\`/?#]`).test(l)) },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name === "dist" || name === ".astro") return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : EXTENSIONS.test(name) ? [full] : [];
  });

const problems = [];
for (const base of SCAN) {
  for (const file of walk(join(root, base))) {
    const rel = relative(root, file).split(sep).join("/");
    if (EXEMPT.some((re) => re.test(rel))) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes("check-hardcoded: ignore")) return;
        const code = line.replace(/^\s*(\/\/|\*|\/\*).*/, ""); // comments may mention anything
        for (const rule of RULES) if (rule.test(code)) problems.push(`${rel}:${i + 1}  ${rule.name}\n    ${line.trim()}`);
        if (/(import\.meta\.env|process\.env)/.test(code) && !ENV_ALLOWED.some((re) => re.test(rel))) {
          problems.push(`${rel}:${i + 1}  environment access outside a config module\n    ${line.trim()}`);
        }
      });
  }
}

if (problems.length) {
  console.error(`Found ${problems.length} hardcoded value(s):\n`);
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("check-hardcoded: clean");
