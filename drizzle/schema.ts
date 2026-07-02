import { relations } from "drizzle-orm";
import {
  boolean,
  jsonb,
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

export const messageChannel = pgEnum("message_channel", ["shared", "private"]);

export const messageSenderType = pgEnum("message_sender_type", ["participant", "agent"]);

export const pipelineStatus = pgEnum("pipeline_status", [
  "awaiting_situations",
  "pipeline_running",
  "awaiting_clarification",
  "options_published",
  "post_resolution",
]);

export const AGENT_KEYS = [
  "legal_domain",
  "precedents",
  "compatibility",
  "synthesis",
] as const;

export type AgentKey = (typeof AGENT_KEYS)[number];

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

export const roomPipelineStates = pgTable("room_pipeline_states", {
  roomId: uuid("room_id")
    .primaryKey()
    .references(() => rooms.id, { onDelete: "cascade" }),
  status: pipelineStatus("status").notNull().default("awaiting_situations"),
  legalDomain: text("legal_domain"),
  jurisdiction: text("jurisdiction"),
  applicableNorms: text("applicable_norms"),
  caseLawResults: jsonb("case_law_results"),
  compatibilityAnalysis: jsonb("compatibility_analysis"),
  clarificationStatus: jsonb("clarification_status").notNull().default({}),
  currentAgent: text("current_agent"),
  pendingInput: jsonb("pending_input"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const situationDescriptions = pgTable(
  "situation_descriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    whatHappened: text("what_happened").notNull(),
    whyDispute: text("why_dispute").notNull(),
    supportingInfo: text("supporting_info").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("situation_descriptions_room_user_unique").on(table.roomId, table.userId)],
);

export const roomMessages = pgTable("room_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  channel: messageChannel("channel").notNull(),
  participantUserId: uuid("participant_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  senderType: messageSenderType("sender_type").notNull(),
  senderAgent: text("sender_agent"),
  senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  contentByLocale: jsonb("content_by_locale"),
  messageMetadata: jsonb("message_metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agentPrompts = pgTable("agent_prompts", {
  agentKey: text("agent_key").primaryKey(),
  systemPrompt: text("system_prompt").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pipelineEventLogs = pgTable("pipeline_event_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  agentKey: text("agent_key"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roomsRelations = relations(rooms, ({ many, one }) => ({
  participants: many(users),
  pipelineState: one(roomPipelineStates),
  messages: many(roomMessages),
  situationDescriptions: many(situationDescriptions),
  pipelineEventLogs: many(pipelineEventLogs),
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

export const roomPipelineStatesRelations = relations(roomPipelineStates, ({ one }) => ({
  room: one(rooms, {
    fields: [roomPipelineStates.roomId],
    references: [rooms.id],
  }),
}));

export const situationDescriptionsRelations = relations(situationDescriptions, ({ one }) => ({
  room: one(rooms, {
    fields: [situationDescriptions.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [situationDescriptions.userId],
    references: [users.id],
  }),
}));

export const roomMessagesRelations = relations(roomMessages, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMessages.roomId],
    references: [rooms.id],
  }),
}));

export const pipelineEventLogsRelations = relations(pipelineEventLogs, ({ one }) => ({
  room: one(rooms, {
    fields: [pipelineEventLogs.roomId],
    references: [rooms.id],
  }),
}));

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  openaiApiKey: text("openai_api_key").notNull().default(""),
  airtableApiKey: text("airtable_api_key").notNull().default(""),
  legalDataHunterApiKey: text("legal_data_hunter_api_key").notNull().default(""),
  testPersonalityTypeUrl: text("test_personality_type_url").notNull().default(""),
  testFaceFearUrl: text("test_face_fear_url").notNull().default(""),
  testCharacterTraitsUrl: text("test_character_traits_url").notNull().default(""),
  testPersonalityConflictsUrl: text("test_personality_conflicts_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
