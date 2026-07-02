"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  loadAgentTestOptions,
  loadAgentTestPreview,
  saveAgentPromptAction,
  testAgentPromptAction,
} from "@/app/admin/settings/agent-prompt-actions";
import { useLocale } from "@/components/locale-provider";
import { AGENT_KEYS, type AgentKey } from "@/lib/pipeline/agent-keys";

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

type AgentPromptRow = {
  agentKey: AgentKey;
  systemPrompt: string;
};

type AgentPromptsSettingsContentProps = {
  prompts: AgentPromptRow[];
};

type TestOption = { id: string; label: string };
type UserPreview = { personalBotPrompt: string; disputeAnswers: string; preferredLocale: string } | null;
type RoomPreview = {
  jurisdiction: string;
  side1Answers: string;
  side2Answers: string;
  side1Locale: string;
  side2Locale: string;
  bothSidesReady: boolean;
} | null;

function tabLabel(agentKey: AgentKey, admin: ReturnType<typeof useLocale>["admin"]) {
  if (agentKey === "psychodynamic") return admin.agentTabPsychodynamic;
  if (agentKey === "interests") return admin.agentTabInterests;
  if (agentKey === "emotional_triggers") return admin.agentTabEmotionalTriggers;
  return admin.agentTabLegalAnalysis;
}

export function AgentPromptsSettingsContent({ prompts }: AgentPromptsSettingsContentProps) {
  const { admin } = useLocale();
  const [activeTab, setActiveTab] = useState<AgentKey>("psychodynamic");
  const [drafts, setDrafts] = useState<Record<AgentKey, string>>(() =>
    Object.fromEntries(prompts.map((row) => [row.agentKey, row.systemPrompt])) as Record<AgentKey, string>,
  );
  const [testOptions, setTestOptions] = useState<TestOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [userPreview, setUserPreview] = useState<UserPreview>(null);
  const [roomPreview, setRoomPreview] = useState<RoomPreview>(null);
  const [testResult, setTestResult] = useState<unknown>(null);
  const [savePending, startSaveTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();

  const isUserAgent = activeTab === "psychodynamic" || activeTab === "emotional_triggers";
  const currentDraft = drafts[activeTab] ?? "";

  useEffect(() => {
    let cancelled = false;

    void loadAgentTestOptions(activeTab).then((result) => {
      if (cancelled) return;
      setTestOptions(result.options);
      setSelectedUserId("");
      setSelectedRoomId("");
      setUserPreview(null);
      setRoomPreview(null);
      setTestResult(null);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (isUserAgent && !selectedUserId) {
      setUserPreview(null);
      return;
    }
    if (!isUserAgent && !selectedRoomId) {
      setRoomPreview(null);
      return;
    }

    let cancelled = false;
    void loadAgentTestPreview({
      agentKey: activeTab,
      userId: selectedUserId || undefined,
      roomId: selectedRoomId || undefined,
    }).then((preview) => {
      if (cancelled) return;
      if (isUserAgent) setUserPreview(preview as UserPreview);
      else setRoomPreview(preview as RoomPreview);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, isUserAgent, selectedUserId, selectedRoomId]);

  const resultJson = useMemo(() => {
    if (!testResult) return "";
    return JSON.stringify(testResult, null, 2);
  }, [testResult]);

  const onSave = () => {
    const formData = new FormData();
    formData.set("agentKey", activeTab);
    formData.set("systemPrompt", currentDraft);

    startSaveTransition(async () => {
      try {
        await saveAgentPromptAction(formData);
        toast.success(admin.agentPromptSaved);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  const onTest = () => {
    const formData = new FormData();
    formData.set("agentKey", activeTab);
    formData.set("systemPrompt", currentDraft);
    if (isUserAgent) {
      formData.set("userId", selectedUserId);
      if (userPreview?.preferredLocale) {
        formData.set("targetLocale", userPreview.preferredLocale);
      }
    } else {
      formData.set("roomId", selectedRoomId);
      formData.set("targetLocale", roomPreview?.side1Locale ?? "en");
    }

    startTestTransition(async () => {
      try {
        const result = await testAgentPromptAction(formData);
        setTestResult(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Test failed");
      }
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-body-sm text-on-surface-variant">{admin.agentPromptsSubtitle}</p>

      <div className="flex flex-wrap gap-2 border-b border-outline-variant/20">
        {AGENT_KEYS.map((key) => (
          <button
            className={
              activeTab === key
                ? "border-b-2 border-tertiary px-4 py-3 font-display text-body-md font-semibold text-tertiary"
                : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
            }
            key={key}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {tabLabel(key, admin)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="block font-display text-headline-md text-on-surface">{admin.agentSystemPrompt}</label>
        <textarea
          className={`${inputClass} min-h-[200px] font-mono text-body-sm`}
          onChange={(event) =>
            setDrafts((prev) => ({
              ...prev,
              [activeTab]: event.target.value,
            }))
          }
          value={currentDraft}
        />
        <button
          className="rounded-lg bg-tertiary px-6 py-2.5 text-body-sm font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 disabled:opacity-60"
          disabled={savePending || !currentDraft.trim()}
          onClick={onSave}
          type="button"
        >
          {savePending ? "..." : admin.save}
        </button>
      </div>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <h4 className="font-display text-headline-md text-on-surface">{admin.agentTestPanel}</h4>

        {isUserAgent ? (
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.agentTestSelectUser}</label>
            <select
              className={inputClass}
              onChange={(event) => setSelectedUserId(event.target.value)}
              value={selectedUserId}
            >
              <option value="">—</option>
              {testOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.agentTestSelectRoom}</label>
            <select
              className={inputClass}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              value={selectedRoomId}
            >
              <option value="">—</option>
              {testOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {(userPreview || roomPreview) && (
          <div className="space-y-3">
            <p className="font-display text-label-md text-on-surface">{admin.agentTestInput}</p>
            {userPreview ? (
              <>
                <p className="text-body-sm text-on-surface-variant">
                  {admin.agentTestResponseLocale}: {userPreview.preferredLocale === "uk" ? "Українська" : "English"}
                </p>
                <div>
                  <p className="mb-1 text-body-sm text-on-surface-variant">{admin.agentTestPersonalBotPrompt}</p>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-surface-container p-3 text-body-sm text-on-surface">
                    {userPreview.personalBotPrompt}
                  </pre>
                </div>
                {(activeTab === "emotional_triggers") ? (
                  <div>
                    <p className="mb-1 text-body-sm text-on-surface-variant">{admin.agentTestDisputeAnswers}</p>
                    <pre className="max-h-48 overflow-auto rounded-lg bg-surface-container p-3 text-body-sm text-on-surface">
                      {userPreview.disputeAnswers}
                    </pre>
                  </div>
                ) : null}
              </>
            ) : null}
            {roomPreview ? (
              <>
                <p className="text-body-sm text-on-surface-variant">
                  {admin.agentTestResponseLocale}: Side 1 — {roomPreview.side1Locale === "uk" ? "Українська" : "English"}
                  {roomPreview.side1Locale !== roomPreview.side2Locale
                    ? `; Side 2 — ${roomPreview.side2Locale === "uk" ? "Українська" : "English"} (pipeline stores both)`
                    : ""}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {admin.agentTestJurisdiction}: {roomPreview.jurisdiction}
                </p>
                <div>
                  <p className="mb-1 text-body-sm text-on-surface-variant">Side 1</p>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-surface-container p-3 text-body-sm text-on-surface">
                    {roomPreview.side1Answers}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-body-sm text-on-surface-variant">Side 2</p>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-surface-container p-3 text-body-sm text-on-surface">
                    {roomPreview.side2Answers}
                  </pre>
                </div>
              </>
            ) : null}
          </div>
        )}

        <button
          className="rounded-lg border border-tertiary px-6 py-2.5 text-body-sm font-bold text-tertiary transition-all hover:bg-tertiary/10 disabled:opacity-60"
          disabled={testPending || (isUserAgent ? !selectedUserId : !selectedRoomId)}
          onClick={onTest}
          type="button"
        >
          {testPending ? "..." : admin.agentTestRun}
        </button>

        {testResult ? (
          <div>
            <p className="mb-1 font-display text-label-md text-on-surface">{admin.agentTestResult}</p>
            <pre className="max-h-96 overflow-auto rounded-lg bg-surface-container p-3 text-body-sm text-on-surface">
              {resultJson}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
