import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userTestCompletions, users } from "@/drizzle/schema";
import { isParticipantRole } from "@/lib/participant-roles";
import { isTestUnlocked, TEST_KEYS, type TestKey } from "@/lib/test-keys";

export type OnboardingStep = "welcome" | "consent" | "tests" | "complete";

export type OnboardingStatus = {
  welcomeSeenAt: Date | null;
  disclaimerAcceptedAt: Date | null;
  onboardingCompletedAt: Date | null;
  completedTests: TestKey[];
  testsComplete: boolean;
  nextStep: OnboardingStep;
  nextPath: string;
};

export async function getUserOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return {
      welcomeSeenAt: null,
      disclaimerAcceptedAt: null,
      onboardingCompletedAt: null,
      completedTests: [],
      testsComplete: false,
      nextStep: "welcome",
      nextPath: "/onboarding/welcome",
    };
  }

  const completions = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  const completedTests = completions
    .map((row) => row.testKey)
    .filter((key): key is TestKey => TEST_KEYS.includes(key as TestKey));

  const completedSet = new Set(completedTests);
  const testsComplete = TEST_KEYS.every((key) => completedSet.has(key));

  let nextStep: OnboardingStep = "complete";
  let nextPath = "/dashboard";

  if (!user.disclaimerAcceptedAt) {
    if (!user.welcomeSeenAt) {
      nextStep = "welcome";
      nextPath = "/onboarding/welcome";
    } else {
      nextStep = "consent";
      nextPath = "/onboarding/consent";
    }
  } else if (!testsComplete || !user.onboardingCompletedAt) {
    nextStep = "tests";
    nextPath = "/onboarding/tests";
  }

  return {
    welcomeSeenAt: user.welcomeSeenAt,
    disclaimerAcceptedAt: user.disclaimerAcceptedAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    completedTests,
    testsComplete,
    nextStep,
    nextPath,
  };
}

export async function getPostLoginRedirect(userId: string, role: string) {
  if (role === "admin") return "/admin/sessions";
  if (!isParticipantRole(role)) return "/login";
  const status = await getUserOnboardingStatus(userId);
  return status.nextPath;
}

export function getOnboardingPathForStep(step: OnboardingStep) {
  switch (step) {
    case "welcome":
      return "/onboarding/welcome";
    case "consent":
      return "/onboarding/consent";
    case "tests":
      return "/onboarding/tests";
    case "complete":
      return "/dashboard";
  }
}

export function canAccessOnboardingStep(
  status: OnboardingStatus,
  step: Exclude<OnboardingStep, "complete">,
) {
  if (step === "welcome") return !status.welcomeSeenAt;
  if (step === "consent") return !!status.welcomeSeenAt && !status.disclaimerAcceptedAt;
  if (step === "tests") {
    return !!status.welcomeSeenAt && !!status.disclaimerAcceptedAt && !status.onboardingCompletedAt;
  }
  return false;
}

export function getTestStatuses(completedTests: TestKey[]) {
  const completedSet = new Set(completedTests);
  return TEST_KEYS.map((key) => ({
    key,
    completed: completedSet.has(key),
    unlocked: isTestUnlocked(key, completedSet),
  }));
}
