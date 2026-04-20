import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mode = process.argv[2]; // e.g. "dev", "production", "test"
const command = process.argv.slice(3); // rest of command

if (!mode || command.length === 0) {
  console.error("Usage: bun set-env.ts <env> <command...>");
  process.exit(1);
}

const envFileLocal = path.resolve(__dirname, `.env.${mode}.local`);
const envFileShared = path.resolve(__dirname, `.env.${mode}`);
const envFile = fs.existsSync(envFileLocal)
  ? envFileLocal
  : fs.existsSync(envFileShared)
    ? envFileShared
    : null;

if (!envFile) {
  console.warn(
    `Warning: no env file found for mode "${mode}" — proceeding with empty env`
  );
} else {
  const dotenvResult = dotenv.config({ path: envFile });
  if (dotenvResult.error) {
    console.error(`Failed to load ${envFile}`);
    console.error(dotenvResult.error);
    process.exit(1);
  }
}

const [cmd, ...args] = command as [string, ...string[]];
const nodeEnvMap: Record<string, string> = {
  dev: "development",
  production: "production",
  test: "test",
};
const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: (nodeEnvMap[mode] ?? mode) as NodeJS.ProcessEnv["NODE_ENV"],
};
const spawnResult = spawnSync(cmd, args, {
  stdio: "inherit",
  shell: true,
  env,
});
process.exit(spawnResult.status ?? 1);
