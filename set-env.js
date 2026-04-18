import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mode = process.argv[2]; // e.g. "test", "dev"
const command = process.argv.slice(3); // rest of command

if (!mode || command.length === 0) {
  console.error("Usage: node set-env.js <env> <command...>");
  process.exit(1);
}

const envFile = path.resolve(__dirname, `.env.${mode}.local`);
if (!fs.existsSync(envFile)) {
  console.error(`Env file not found: ${envFile}`);
  process.exit(1);
}

// Load env vars
const result = dotenv.config({ path: envFile });
if (result.error) {
  console.error(`Failed to load ${envFile}`);
  console.error(result.error);
  process.exit(1);
}

const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: mode,
  },
});

child.on("exit", (code) => process.exit(code));
