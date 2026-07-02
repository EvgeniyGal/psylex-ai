export const AGENT_KEYS = ["psychodynamic", "interests", "emotional_triggers", "legal_analysis"] as const;

export type AgentKey = (typeof AGENT_KEYS)[number];

export const AGENT_KEY_LABELS: Record<AgentKey, string> = {
  psychodynamic: "Psychodynamic Profile",
  interests: "Interests Analysis",
  emotional_triggers: "Emotional Triggers",
  legal_analysis: "Legal Analysis",
};

export type PipelineEventType =
  | "pipeline_triggered"
  | "pipeline_completed"
  | "agent_started"
  | "agent_completed"
  | "agent_failed"
  | "agent_skipped";
