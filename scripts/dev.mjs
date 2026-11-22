#!/usr/bin/env node
/**
 * One command for local development:  npm run dev
 * Checks Node and the ports, regenerates the Worker's catalog, then runs the playground Worker and the
 * site together with prefixed logs. Ctrl+C stops both. It only ever signals the two processes it started.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const HOST = "127.0.0.1";
/** Keep in step with apps/worker/wrangler.toml ([dev] port) and PUBLIC_PLAYGROUND_URL in apps/web/.env. */
const DEV_PORTS = { worker: 8788, web: 4321 };
const SITE_URL = `http://localhost:${DEV_PORTS.web}`;

const fail = (message) => {
  console.error(`\n${message}\n`);
  process.exit(1);
};

// --- Node version ----------------------------------------------------------------------------------
const wanted = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).engines.node.replace(/^[^\d]*/, "");
const compare = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};
if (compare(process.versions.node, wanted) < 0) {
  fail(`Node ${process.versions.node} is too old: Astro 7 needs ${wanted} or newer.\nRun:  nvm install && nvm use   (it reads .nvmrc)`);
}

// --- Ports -----------------------------------------------------------------------------------------
const isFree = (port) =>
  new Promise((resolve) => {
    const probe = createServer().once("error", () => resolve(false)).once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, HOST);
  });

for (const [name, port] of Object.entries(DEV_PORTS)) {
  if (!(await isFree(port))) {
    fail(`Port ${port} (${name}) is already in use.\nSee what holds it:  lsof -nP -iTCP:${port} -sTCP:LISTEN\nStop that process, or change the port (see scripts/dev.mjs and the README).`);
  }
}

// --- Environment hints -----------------------------------------------------------------------------
const envFile = join(root, "apps", "web", ".env");
try {
  readFileSync(envFile);
} catch {
  console.log("apps/web/.env not found. Copying .env.example is the usual fix:  cp .env.example apps/web/.env\nContinuing without it: the playground will be disabled.\n");
}

// --- Generated Worker catalog ----------------------------------------------------------------------
const built = spawnSync("npm", ["run", "catalog:build", "--silent"], { cwd: root, stdio: "inherit" });
if (built.status !== 0) fail("Could not build the Worker's catalog. Fix the error above (try: npm run catalog:validate).");

// --- Run both --------------------------------------------------------------------------------------
const children = [];
let stopping = false;

const stopAll = (code) => {
  if (stopping) return;
  stopping = true;
  // Each child leads its own process group (npx starts grandchildren), so signal the group, never anything else.
  for (const child of children) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  setTimeout(() => process.exit(code), 800).unref();
};

function run(label, command, args, cwd) {
  const child = spawn(command, args, { cwd, env: { ...process.env, FORCE_COLOR: "1" }, stdio: ["ignore", "pipe", "pipe"], detached: true });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) {
    createInterface({ input: stream }).on("line", (line) => console.log(`[${label}] ${line}`));
  }
  child.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(`\n[${label}] stopped (${signal ?? `exit ${code}`}). Stopping the other process too.`);
    stopAll(code ?? 1);
  });
}

console.log(`Site:     ${SITE_URL}/th/\nPlayground proxy: http://${HOST}:${DEV_PORTS.worker}/healthz\nPress Ctrl+C to stop both.\n`);
run("worker", "npx", ["wrangler", "dev"], join(root, "apps", "worker"));
// --ignore-lock keeps astro in the foreground even when it thinks an AI agent launched it (it would
// otherwise detach and this runner would see it "exit"). The ports were checked free above.
run("web", "npx", ["astro", "dev", "--port", String(DEV_PORTS.web), "--ignore-lock"], join(root, "apps", "web"));

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
