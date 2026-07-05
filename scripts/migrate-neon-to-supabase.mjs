import "dotenv/config";
import { execSync } from "node:child_process";
import postgres from "postgres";

const sourceUrl = process.env.DATABASE_URL;
const targetUrl = (process.env.SUPABASE_DATABASE_URL ?? "").replace(/^"|"$/g, "");

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
];

const TRUNCATE_ORDER = [...APP_TABLES].reverse();
const INSERT_ORDER = APP_TABLES;

const TENANT_IDS = [
  process.env.POOLER_TENANT_ID,
  process.env.SUPABASE_TENANT_ID,
  "default",
  "postgres",
  "supabase",
  "local",
].filter(Boolean);

function supabaseConnectionVariants(baseUrl) {
  const variants = [];
  try {
    const base = new URL(baseUrl);
    const password = decodeURIComponent(base.password);
    const user = decodeURIComponent(base.username);
    const ports = base.port === "6543" ? ["6543", "5432"] : [base.port || "5432"];

    for (const port of ports) {
      for (const tenantId of TENANT_IDS) {
        const withOptions = new URL(baseUrl);
        withOptions.port = port;
        withOptions.searchParams.set("options", `reference=${tenantId}`);
        variants.push(withOptions.toString());

        const dotted = new URL(baseUrl);
        dotted.port = port;
        dotted.username = `${user}.${tenantId}`;
        dotted.password = password;
        dotted.searchParams.set("sslmode", "disable");
        variants.push(dotted.toString());
      }

      const plain = new URL(baseUrl);
      plain.port = port;
      plain.searchParams.set("sslmode", "disable");
      variants.push(plain.toString());
    }
  } catch {
    variants.push(baseUrl);
  }

  return [...new Set(variants)];
}

async function probe(url, label) {
  const sql = postgres(url, { prepare: false, connect_timeout: 10, max: 1 });
  try {
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const counts = tables.length
      ? await sql`
          SELECT relname AS table_name, n_live_tup AS approx_rows
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY relname
        `
      : [];
    console.log(`\n${label}: connected (${tables.length} public tables)`);
    for (const row of counts) {
      if (row.approx_rows > 0) {
        console.log(`  ${row.table_name}: ~${row.approx_rows} rows`);
      }
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

async function resolveTargetUrl() {
  const candidates = [targetUrl, ...supabaseConnectionVariants(targetUrl)].filter(
    (url, index, all) => all.indexOf(url) === index,
  );

  for (const candidate of candidates) {
    const sql = postgres(candidate, { prepare: false, connect_timeout: 8, max: 1 });
    try {
      await sql`SELECT 1`;
      await sql.end({ timeout: 5 });
      return candidate;
    } catch {
      await sql.end({ timeout: 5 }).catch(() => undefined);
    }
  }
  return null;
}

function run(cmd, env = process.env) {
  execSync(cmd, { stdio: "inherit", env, shell: true });
}

async function copyAllData(sourceUrl, targetUrl) {
  const source = postgres(sourceUrl, { prepare: false, connect_timeout: 30, max: 1 });
  const target = postgres(targetUrl, { prepare: false, connect_timeout: 30, max: 1 });

  try {
    const tableData = new Map();

    for (const table of APP_TABLES) {
      const rows = await source.unsafe(`SELECT * FROM public."${table}"`);
      tableData.set(table, rows);
      console.log(`  ${table}: read ${rows.length} rows from Neon`);
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

      console.log(`  ${table}: writing ${rows.length} rows to Supabase...`);

      const batchSize = 50;
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
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }
  if (!targetUrl) {
    console.error("SUPABASE_DATABASE_URL is not set in .env");
    process.exit(1);
  }

  console.log("Step 1: Probing databases...");
  const sourceProbe = await probe(sourceUrl, "Neon (source)");
  if (!sourceProbe.ok) process.exit(1);

  const effectiveTargetUrl = await resolveTargetUrl();
  if (!effectiveTargetUrl) {
    console.error("\nSupabase: could not connect.");
    console.error("Self-hosted Supavisor needs a tenant id. Add to .env:");
    console.error('  SUPABASE_TENANT_ID=your_tenant_id');
    console.error("Find it on the server in supabase .env (POOLER_TENANT_ID / external_id).");
    console.error("Or use a direct Postgres URL that bypasses the pooler.");
    process.exit(1);
  }

  if (effectiveTargetUrl !== targetUrl) {
    console.log("\nResolved working Supabase connection (tenant/direct variant).");
  }

  const targetProbe = await probe(effectiveTargetUrl, "Supabase (target)");
  if (!targetProbe.ok) process.exit(1);

  console.log("\nStep 2: Applying schema migrations on Supabase...");
  run("npx drizzle-kit migrate", { ...process.env, DATABASE_URL: effectiveTargetUrl });

  console.log("\nStep 3: Copying data from Neon to Supabase...");
  await copyAllData(sourceUrl, effectiveTargetUrl);

  console.log("\nStep 4: Verifying row counts on Supabase...");
  await probe(effectiveTargetUrl, "Supabase (after import)");

  console.log("\nMigration complete.");
  console.log("Next: set DATABASE_URL to the working Supabase URL and restart the app.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
