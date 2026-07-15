import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

// Load .env for standalone `tsx prisma/seed.ts` runs; a no-op when the env is
// already populated (e.g. via `prisma db seed` or in Docker).
const loadEnvFile = (
  process as NodeJS.Process & { loadEnvFile?: () => void }
).loadEnvFile;
try {
  loadEnvFile?.();
} catch {
  // no .env file present — rely on the ambient environment
}

if (
  !process.env.DATABASE_URL ||
  !process.env.ADMIN_EMAIL ||
  !process.env.ADMIN_PASSWORD ||
  !process.env.ADMIN_NAME
) {
  throw new Error(
    "Seed requires DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME."
  );
}

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL.toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME;

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    // Don't clobber a password the admin may have rotated.
    update: { name, role: "ADMIN" },
    create: { email, name, role: "ADMIN", hashedPassword },
  });
  console.log(`Seeded admin user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
