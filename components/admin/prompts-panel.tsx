"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAgentPrompt, testAgentPrompt } from "@/app/admin/settings/actions";
import { useLocale } from "@/components/locale-provider";

const textareaClass =
  "min-h-[140px] w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 font-mono text-body-sm text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

type PromptsPanelProps = {
  prompts: {
    legal_domain: string;
    precedents: string;
    compatibility: string;
    synthesis: string;
  };
};

const AGENTS = [
  { key: "legal_domain", labelKey: "agentLegalDomain" as const },
  { key: "precedents", labelKey: "agentPrecedents" as const },
  { key: "compatibility", labelKey: "agentCompatibility" as const },
  { key: "synthesis", labelKey: "agentSynthesis" as const },
] as const;

export function PromptsPanel({ prompts }: PromptsPanelProps) {
  const { admin } = useLocale();
  const [selected, setSelected] = useState<(typeof AGENTS)[number]["key"]>("legal_domain");
  const [drafts, setDrafts] = useState(prompts);
  const [sampleInput, setSampleInput] = useState('{"situations": []}');
  const [testOutput, setTestOutput] = useState("");
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();

  const onSave = () => {
    const formData = new FormData();
    formData.set("agentKey", selected);
    formData.set("systemPrompt", drafts[selected]);
    startSave(async () => {
      await saveAgentPrompt(formData);
      toast.success(admin.settingsSaved);
    });
  };

  const onTest = () => {
    const formData = new FormData();
    formData.set("systemPrompt", drafts[selected]);
    formData.set("sampleInput", sampleInput);
    startTest(async () => {
      try {
        const result = await testAgentPrompt(formData);
        setTestOutput(result);
      } catch (e) {
        setTestOutput(e instanceof Error ? e.message : "Test failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-body-sm text-on-surface-variant">{admin.promptsSubtitle}</p>

      <div className="flex flex-wrap gap-2">
        {AGENTS.map((agent) => (
          <button
            className={
              selected === agent.key
                ? "rounded-lg bg-tertiary px-4 py-2 text-body-sm font-semibold text-on-tertiary"
                : "rounded-lg border border-outline-variant/30 px-4 py-2 text-body-sm text-on-surface-variant hover:text-on-surface"
            }
            key={agent.key}
            onClick={() => setSelected(agent.key)}
            type="button"
          >
            {admin[agent.labelKey]}
          </button>
        ))}
      </div>

      <textarea
        className={textareaClass}
        onChange={(e) => setDrafts((d) => ({ ...d, [selected]: e.target.value }))}
        value={drafts[selected]}
      />

      <button
        className="rounded-lg bg-tertiary px-6 py-2.5 text-body-sm font-bold text-on-tertiary disabled:opacity-60"
        disabled={savePending}
        onClick={onSave}
        type="button"
      >
        {admin.save}
      </button>

      <div className="glass-panel space-y-3 rounded-xl p-5">
        <h4 className="font-display text-headline-md text-on-surface">{admin.testPrompt}</h4>
        <label className="block text-body-sm text-on-surface-variant">{admin.testPromptInput}</label>
        <textarea
          className={textareaClass}
          onChange={(e) => setSampleInput(e.target.value)}
          value={sampleInput}
        />
        <button
          className="rounded-lg border border-outline-variant/30 px-4 py-2 text-body-sm font-semibold text-on-surface hover:border-tertiary disabled:opacity-60"
          disabled={testPending}
          onClick={onTest}
          type="button"
        >
          {admin.testPromptRun}
        </button>
        {testOutput ? (
          <div>
            <p className="mb-1 text-body-sm font-semibold text-on-surface-variant">{admin.testPromptOutput}</p>
            <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-3 text-body-sm">{testOutput}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
