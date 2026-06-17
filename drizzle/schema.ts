import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "admin",
  "mediator",
  "plaintiff",
  "defendant",
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  login: text("login").notNull().unique(),
  password: text("password").notNull(),
  role: userRole("role").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
});

export const sessionsRelations = relations(sessions, ({ many }) => ({
  participants: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  session: one(sessions, {
    fields: [users.sessionId],
    references: [sessions.id],
  }),
}));
