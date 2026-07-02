export const TEST_KEYS = [
  "personality_type",
  "face_fear",
  "character_traits",
  "personality_conflicts",
] as const;

export type TestKey = (typeof TEST_KEYS)[number];
