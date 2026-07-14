import "dotenv/config";
import { execSync } from "node:child_process";
import postgres from "postgres";

/**
 * Copy app data from old self-hosted Supabase (O_DATABASE_URL)
 * into the new cloud project (DATABASE_URL).
 *
 * Usage: node scripts/migrate-selfhosted-to-cloud.mjs
 */
const sourceUrl = process.env.O_DATABASE_URL;
const targetUrl = (process.env.DATABASE_URL ?? "").replace(/^"|"$/g, "");

// Insert order respects soft dependencies; FKs are disabled during copy.
const APP_TABLES = [
  "rooms",
  "users",
  "user_test_completions",
  "magic_tokens",
  "platform_settings",
  "legal_documents",
  "document_chunks",
  "agent_prompts",
  "pipeline_event_logs",
  "room_messages",
  "mediation_filing_receipts",
];

const TRUNCATE_ORDER = [...APP_TABLES].reverse();
const INSERT_ORDER = APP_TABLES;

function sslFor(url) {
  try {
    const host = new URL(url).hostname;
    if (host.includes("supabase.co") || host.includes("pooler.supabase.com")) {
      return "require";
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function probe(url, label) {
  const sql = postgres(url, {
    ssl: sslFor(url),
    prepare: false,
    connect_timeout: 20,
    max: 1,
  });
  try {
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log(`\n${label}: connected (${tables.length} public tables)`);
    for (const { tablename } of tables) {
      const [row] = await sql.unsafe(
        `SELECT count(*)::int AS n FROM public."${tablename}"`,
      );
      if (row.n > 0) console.log(`  ${tablename}: ${row.n}`);
    }
    return { ok: true };
  } catch (error) {
    console.error(`\n${label}: connection failed`);
    console.error(`  ${error.message}`);
    return { ok: false };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function run(cmd, env = process.env) {
  execSync(cmd, { stdio: "inherit", env, shell: true });
}

async function ensureExtensions(url) {
  const sql = postgres(url, {
    ssl: sslFor(url),
    prepare: false,
    connect_timeout: 20,
    max: 1,
  });
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    console.log("Extensions: vector, pgcrypto OK");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function copyAllData(fromUrl, toUrl) {
  const source = postgres(fromUrl, {
    ssl: sslFor(fromUrl),
    prepare: false,
    connect_timeout: 30,
    max: 1,
  });
  const target = postgres(toUrl, {
    ssl: sslFor(toUrl),
    prepare: false,
    connect_timeout: 30,
    max: 1,
  });

  try {
    const tableData = new Map();

    for (const table of APP_TABLES) {
      const rows = await source.unsafe(`SELECT * FROM public."${table}"`);
      tableData.set(table, rows);
      console.log(`  ${table}: read ${rows.length} rows from source`);
    }

    await target`SET session_replication_role = replica`;

    for (const table of TRUNCATE_ORDER) {
      await target.unsafe(`TRUNCATE public."${table}" CASCADE`);
    }

    for (const table of INSERT_ORDER) {
      const rows = tableData.get(table) ?? [];
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows (skip)`);
        continue;
      }

      console.log(`  ${table}: writing ${rows.length} rows to cloud...`);

      const batchSize = table === "document_chunks" ? 20 : 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await target`INSERT INTO ${target(table)} ${target(batch)}`;
      }

      console.log(`  ${table}: done`);
    }

    await target`SET session_replication_role = DEFAULT`;
  } finally {
    await source.end({ timeout: 10 });
    await target.end({ timeout: 10 });
  }
}

async function main() {
  if (!sourceUrl) {
    console.error("O_DATABASE_URL is not set in .env");
    process.exit(1);
  }
  if (!targetUrl) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  console.log("Step 1: Probing databases...");
  const sourceProbe = await probe(sourceUrl, "OLD self-hosted (source)");
  if (!sourceProbe.ok) process.exit(1);

  const targetProbe = await probe(targetUrl, "NEW cloud (target)");
  if (!targetProbe.ok) process.exit(1);

  console.log("\nStep 2: Ensuring extensions on cloud...");
  await ensureExtensions(targetUrl);

  console.log("\nStep 3: Applying schema migrations on cloud...");
  run("npx drizzle-kit migrate", { ...process.env, DATABASE_URL: targetUrl });

  console.log("\nStep 4: Copying data from self-hosted → cloud...");
  await copyAllData(sourceUrl, targetUrl);

  console.log("\nStep 5: Verifying row counts on cloud...");
  await probe(targetUrl, "NEW cloud (after import)");

  console.log("\nMigration complete.");
  console.log("Restart the Next.js app so it uses the new DATABASE_URL.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
