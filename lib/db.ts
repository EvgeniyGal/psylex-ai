import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://invalid:invalid@localhost:5432/invalid";

const queryClient = postgres(connectionString, {
  prepare: false,
  connect_timeout: 2,
});

export const db = drizzle(queryClient, { schema });
