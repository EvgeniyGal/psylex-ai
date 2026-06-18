import { TestingDashboard } from "@/components/portal/testing-dashboard";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getTestStatuses } from "@/lib/onboarding";
import { guardOnboardingStep, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";
import { resolveTestUrl } from "@/lib/default-test-urls";
import type { TestKey } from "@/lib/test-keys";

const TEST_URL_MAP: Record<TestKey, keyof Awaited<ReturnType<typeof getPlatformSettings>>> = {
  personality_type: "testPersonalityTypeUrl",
  face_fear: "testFaceFearUrl",
  character_traits: "testCharacterTraitsUrl",
  personality_conflicts: "testPersonalityConflictsUrl",
};

export default async function TestsPage() {
  const { status } = await guardOnboardingStep("tests");
  const { role, login } = await requireParticipantSession();
  const settings = await getPlatformSettings();

  const tests = getTestStatuses(status.completedTests).map((test) => ({
    key: test.key,
    url: resolveTestUrl(String(settings[TEST_URL_MAP[test.key]] ?? "")),
    completed: test.completed,
    unlocked: test.unlocked,
  }));

  return (
    <TestingDashboard
      allComplete={status.testsComplete}
      login={login}
      role={role as ParticipantRole}
      tests={tests}
    />
  );
}
