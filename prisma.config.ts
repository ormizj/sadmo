import path from "node:path";
import { defineConfig, env } from "@prisma/config";

// Prisma 7 no longer auto-loads .env. Load it for CLI commands (migrate/seed);
// in Docker/CI the vars are already present, so a missing file is fine.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on the ambient environment
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
