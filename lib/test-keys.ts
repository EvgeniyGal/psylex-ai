export const TEST_KEYS = [
  "personality_type",
  "face_fear",
  "character_traits",
  "personality_conflicts",
] as const;

export type TestKey = (typeof TEST_KEYS)[number];

export const PREREQUISITE_TESTS: Record<TestKey, TestKey[]> = {
  personality_type: [],
  face_fear: [],
  character_traits: [],
  personality_conflicts: ["personality_type", "face_fear", "character_traits"],
};

export function isTestUnlocked(testKey: TestKey, completed: Set<TestKey>) {
  return PREREQUISITE_TESTS[testKey].every((key) => completed.has(key));
}
