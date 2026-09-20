import { execFileSync } from "node:child_process";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit", env: process.env, shell: process.platform === "win32" });
}

run("prisma", ["generate"]);

if (process.env.VERCEL_ENV === "production") {
  for (const required of ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD"]) {
    if (!process.env[required]) throw new Error(`Missing required production environment variable: ${required}`);
  }
  run("prisma", ["migrate", "deploy"]);
  run("prisma", ["db", "seed"]);
}

run("next", ["build"]);
