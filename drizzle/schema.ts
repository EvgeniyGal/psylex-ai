import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "admin",
  "mediator",
  "side1",
  "side2",
]);

export const preferredLocale = pgEnum("preferred_locale", ["en", "uk"]);

export const SIDE_ROLES = ["side1", "side2"] as const;

export const roomJurisdiction = pgEnum("room_jurisdiction", ["ukraine", "usa"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  jurisdiction: roomJurisdiction("jurisdiction").notNull().default("ukraine"),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  login: text("login").notNull().unique(),
  password: text("password").notNull(),
  role: userRole("role").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  welcomeSeenAt: timestamp("welcome_seen_at", { withTimezone: true }),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at", { withTimezone: true }),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  personalBotPrompt: text("personal_bot_prompt"),
  personalBotReadyAt: timestamp("personal_bot_ready_at", { withTimezone: true }),
  preferredLocale: preferredLocale("preferred_locale").notNull().default("en"),
});

export const userTestCompletions = pgTable(
  "user_test_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    testKey: text("test_key").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("user_test_completions_user_test_unique").on(table.userId, table.testKey)],
);

export const magicTokens = pgTable("magic_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  room: one(rooms, {
    fields: [users.roomId],
    references: [rooms.id],
  }),
  magicTokens: many(magicTokens),
  testCompletions: many(userTestCompletions),
}));

export const userTestCompletionsRelations = relations(userTestCompletions, ({ one }) => ({
  user: one(users, {
    fields: [userTestCompletions.userId],
    references: [users.id],
  }),
}));

export const magicTokensRelations = relations(magicTokens, ({ one }) => ({
  user: one(users, {
    fields: [magicTokens.userId],
    references: [users.id],
  }),
}));

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  openaiApiKey: text("openai_api_key").notNull().default(""),
  airtableApiKey: text("airtable_api_key").notNull().default(""),
  testPersonalityTypeUrl: text("test_personality_type_url").notNull().default(""),
  testFaceFearUrl: text("test_face_fear_url").notNull().default(""),
  testCharacterTraitsUrl: text("test_character_traits_url").notNull().default(""),
  testPersonalityConflictsUrl: text("test_personality_conflicts_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
