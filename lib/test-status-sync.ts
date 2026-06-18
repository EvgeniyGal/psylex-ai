import { eq } from "drizzle-orm";
import {
  PERSONAL_BOT_AIRTABLE_CONFIG,
  TEST_AIRTABLE_CONFIG,
} from "@/lib/airtable-config";
import { findAirtableRecordByLogin, hasAirtableRecordForLogin } from "@/lib/airtable";
import { db } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { TEST_KEYS, type TestKey } from "@/lib/test-keys";
import { userTestCompletions, users } from "@/drizzle/schema";

export type TestStatusSyncResult = {
  completedTests: TestKey[];
  testsComplete: boolean;
  personalBotReady: boolean;
  personalBotPrompt: string | null;
  synced: boolean;
};

async function getCompletedTestKeys(userId: string): Promise<Set<TestKey>> {
  const rows = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  return new Set(
    rows
      .map((row) => row.testKey)
      .filter((key): key is TestKey => TEST_KEYS.includes(key as TestKey)),
  );
}

export async function syncUserTestStatus(
  userId: string,
  login: string,
): Promise<TestStatusSyncResult> {
  const settings = await getPlatformSettings();
  const apiKey = settings.airtableApiKey.trim();
  const completedSet = await getCompletedTestKeys(userId);

  if (!apiKey) {
    const [user] = await db
      .select({
        personalBotPrompt: users.personalBotPrompt,
        personalBotReadyAt: users.personalBotReadyAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const completedTests = [...completedSet];
    return {
      completedTests,
      testsComplete: TEST_KEYS.every((key) => completedSet.has(key)),
      personalBotReady: !!user?.personalBotReadyAt,
      personalBotPrompt: user?.personalBotPrompt ?? null,
      synced: false,
    };
  }

  let updated = false;

  for (const testKey of TEST_KEYS) {
    if (completedSet.has(testKey)) continue;

    const config = TEST_AIRTABLE_CONFIG[testKey];
    const found = await hasAirtableRecordForLogin(apiKey, config, login);
    if (!found) continue;

    await db
      .insert(userTestCompletions)
      .values({ userId, testKey })
      .onConflictDoNothing({
        target: [userTestCompletions.userId, userTestCompletions.testKey],
      });

    completedSet.add(testKey);
    updated = true;
  }

  const testsComplete = TEST_KEYS.every((key) => completedSet.has(key));
  let personalBotPrompt: string | null = null;
  let personalBotReady = false;

  if (testsComplete) {
    const record = await findAirtableRecordByLogin(
      apiKey,
      PERSONAL_BOT_AIRTABLE_CONFIG,
      login,
    );
    const promptValue = record?.fields[PERSONAL_BOT_AIRTABLE_CONFIG.promptField];
    const prompt =
      typeof promptValue === "string"
        ? promptValue.trim()
        : promptValue != null
          ? String(promptValue).trim()
          : "";

    if (prompt) {
      personalBotPrompt = prompt;
      personalBotReady = true;
    }

    const [existing] = await db
      .select({
        personalBotPrompt: users.personalBotPrompt,
        personalBotReadyAt: users.personalBotReadyAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const promptChanged = (existing?.personalBotPrompt ?? null) !== personalBotPrompt;
    const readyChanged =
      !!existing?.personalBotReadyAt !== personalBotReady ||
      (personalBotReady && promptChanged);

    if (promptChanged || readyChanged) {
      await db
        .update(users)
        .set({
          personalBotPrompt,
          personalBotReadyAt: personalBotReady ? new Date() : null,
        })
        .where(eq(users.id, userId));
      updated = true;
    }
  } else {
    const [existing] = await db
      .select({ personalBotReadyAt: users.personalBotReadyAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existing?.personalBotReadyAt) {
      await db
        .update(users)
        .set({
          personalBotPrompt: null,
          personalBotReadyAt: null,
        })
        .where(eq(users.id, userId));
      updated = true;
    }
  }

  return {
    completedTests: [...completedSet],
    testsComplete,
    personalBotReady,
    personalBotPrompt,
    synced: updated,
  };
}
