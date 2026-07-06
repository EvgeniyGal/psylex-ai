import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://invalid:invalid@localhost:5432/invalid";

type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: PostgresClient;
};

function createClient() {
  return postgres(connectionString, {
    prepare: false,
    connect_timeout: 2,
    // Supabase session pooler caps total clients; keep each app instance small.
    max: process.env.NODE_ENV === "production" ? 1 : 3,
  });
}

const queryClient = globalForDb.postgresClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
