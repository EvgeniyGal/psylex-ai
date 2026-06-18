import { TestingDashboard } from "@/components/portal/testing-dashboard";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getTestStatuses, getUserOnboardingStatus } from "@/lib/onboarding";
import { guardOnboardingStep, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";
import { resolveTestUrl } from "@/lib/default-test-urls";
import { syncUserTestStatus } from "@/lib/test-status-sync";
import type { TestKey } from "@/lib/test-keys";

const TEST_URL_MAP: Record<TestKey, keyof Awaited<ReturnType<typeof getPlatformSettings>>> = {
  personality_type: "testPersonalityTypeUrl",
  face_fear: "testFaceFearUrl",
  character_traits: "testCharacterTraitsUrl",
  personality_conflicts: "testPersonalityConflictsUrl",
};

export default async function TestsPage() {
  await guardOnboardingStep("tests");
  const { userId, role, login } = await requireParticipantSession();
  const settings = await getPlatformSettings();

  await syncUserTestStatus(userId, login);
  const status = await getUserOnboardingStatus(userId);

  const tests = getTestStatuses(status.completedTests).map((test) => ({
    key: test.key,
    url: resolveTestUrl(String(settings[TEST_URL_MAP[test.key]] ?? "")),
    completed: test.completed,
    unlocked: test.unlocked,
  }));

  return (
    <TestingDashboard
      canProceed={status.canProceed}
      login={login}
      personalBotReady={status.personalBotReady}
      role={role as ParticipantRole}
      tests={tests}
      testsComplete={status.testsComplete}
    />
  );
}
