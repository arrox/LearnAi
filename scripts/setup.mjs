// Prepares the local dev environment: checks Node, installs dependencies,
// creates .env.local and verifies the Claude Code login the app will use.
// Usage: npm run setup
import { execSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const ok = (m) => console.log(`✔ ${m}`);
const warn = (m) => console.log(`⚠ ${m}`);
const fail = (m) => {
  console.error(`✖ ${m}`);
  process.exit(1);
};

const [major] = process.versions.node.split(".").map(Number);
if (major < 20) fail(`Node ${process.versions.node} es muy antiguo; instala Node 20 o superior.`);
ok(`Node ${process.versions.node}`);

console.log("… instalando dependencias (npm install)");
execSync("npm install", { stdio: "inherit" });
ok("Dependencias instaladas");

if (!existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  ok("Creado .env.local desde .env.example");
} else {
  ok(".env.local ya existe (no lo toqué)");
}

const status = spawnSync("claude", ["auth", "status"], { encoding: "utf8", shell: process.platform === "win32" });
if (status.error) {
  warn("No encontré el comando `claude`. Instala Claude Code: npm install -g @anthropic-ai/claude-code");
  warn("Luego inicia sesión con: claude auth login");
} else {
  let loggedIn = false;
  try {
    loggedIn = JSON.parse(status.stdout).loggedIn === true;
  } catch {
    loggedIn = status.status === 0;
  }
  if (loggedIn) ok("Claude Code tiene sesión iniciada: la app usará esa cuenta");
  else warn("Claude Code no tiene sesión iniciada. Ejecuta: claude auth login");
}

if (process.env.ANTHROPIC_API_KEY) {
  warn("Tienes ANTHROPIC_API_KEY en el entorno. Con AI_PROVIDER=claude-code la app la ignora a propósito (para usar tu login de Claude Code); si quieres usarla, pon AI_PROVIDER=api en .env.local.");
}

console.log("\nListo. Arranca con: npm run dev  →  http://localhost:3000");
