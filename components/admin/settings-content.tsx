"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveApiCredentials, saveTestLinks } from "@/app/admin/settings/actions";
import { PromptsPanel } from "@/components/admin/prompts-panel";
import { useLocale } from "@/components/locale-provider";

export type PlatformSettingsRow = {
  id: string;
  openaiApiKey: string;
  airtableApiKey: string;
  legalDataHunterApiKey: string;
  testPersonalityTypeUrl: string;
  testFaceFearUrl: string;
  testCharacterTraitsUrl: string;
  testPersonalityConflictsUrl: string;
  updatedAt: Date;
};

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

const tabs = ["credentials", "tests", "prompts"] as const;
type SettingsTab = (typeof tabs)[number];

type SettingsContentProps = {
  settings: PlatformSettingsRow;
  agentPrompts: {
    legal_domain: string;
    precedents: string;
    compatibility: string;
    synthesis: string;
  };
};

export function SettingsContent({ settings, agentPrompts }: SettingsContentProps) {
  const { admin } = useLocale();
  const [activeTab, setActiveTab] = useState<SettingsTab>("credentials");
  const [credentialsPending, startCredentialsTransition] = useTransition();
  const [testsPending, startTestsTransition] = useTransition();

  const onSaveCredentials = (formData: FormData) => {
    startCredentialsTransition(async () => {
      await saveApiCredentials(formData);
      toast.success(admin.settingsSaved);
    });
  };

  const onSaveTests = (formData: FormData) => {
    startTestsTransition(async () => {
      await saveTestLinks(formData);
      toast.success(admin.settingsSaved);
    });
  };

  const testFields = [
    { name: "testPersonalityTypeUrl", label: admin.testPersonalityType, value: settings.testPersonalityTypeUrl },
    { name: "testFaceFearUrl", label: admin.testFaceFear, value: settings.testFaceFearUrl },
    { name: "testCharacterTraitsUrl", label: admin.testCharacterTraits, value: settings.testCharacterTraitsUrl },
    {
      name: "testPersonalityConflictsUrl",
      label: admin.testPersonalityConflicts,
      value: settings.testPersonalityConflictsUrl,
    },
  ] as const;

  const tabLabel = (tab: SettingsTab) => {
    if (tab === "credentials") return admin.tabCredentials;
    if (tab === "tests") return admin.tabTests;
    return admin.tabPrompts;
  };

  return (
    <section className="space-y-stack-lg">
      <div>
        <h3 className="mb-2 font-display text-display-lg text-on-surface">{admin.settingsTitle}</h3>
        <p className="text-body-md text-on-surface-variant">{admin.settingsSubtitle}</p>
      </div>

      <div className="glass-card rounded-xl p-6 md:p-8">
        <div className="mb-8 flex gap-2 border-b border-outline-variant/20">
          {tabs.map((tab) => (
            <button
              className={
                activeTab === tab
                  ? "border-b-2 border-tertiary px-4 py-3 font-display text-body-md font-semibold text-tertiary"
                  : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {activeTab === "credentials" ? (
          <form action={onSaveCredentials} className="space-y-6">
            <p className="text-body-sm text-on-surface-variant">{admin.credentialsSubtitle}</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.openaiApiKeyLabel}</label>
                <input
                  className={inputClass}
                  defaultValue={settings.openaiApiKey}
                  name="openaiApiKey"
                  placeholder="sk-..."
                  type="password"
                />
              </div>
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.airtableApiKeyLabel}</label>
                <input
                  className={inputClass}
                  defaultValue={settings.airtableApiKey}
                  name="airtableApiKey"
                  placeholder="pat..."
                  type="password"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-body-sm text-on-surface-variant">
                  {admin.legalDataHunterApiKeyLabel}
                </label>
                <input
                  className={inputClass}
                  defaultValue={settings.legalDataHunterApiKey}
                  name="legalDataHunterApiKey"
                  placeholder="sk-..."
                  type="password"
                />
                <p className="mt-1 text-body-sm text-on-surface-variant">{admin.legalDataHunterApiKeyHelp}</p>
              </div>
            </div>
            <button
              className="rounded-lg bg-tertiary px-6 py-2.5 text-body-sm font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 disabled:opacity-60"
              disabled={credentialsPending}
              type="submit"
            >
              {credentialsPending ? "..." : admin.save}
            </button>
          </form>
        ) : activeTab === "tests" ? (
          <form action={onSaveTests} className="space-y-6">
            <p className="text-body-sm text-on-surface-variant">{admin.testsSubtitle}</p>
            <div className="grid gap-5">
              {testFields.map((field) => (
                <div className="glass-panel rounded-xl p-5" key={field.name}>
                  <label className="mb-2 block font-display text-headline-md text-on-surface">{field.label}</label>
                  <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.testUrlLabel}</label>
                  <input
                    className={inputClass}
                    defaultValue={field.value}
                    name={field.name}
                    placeholder="https://"
                    type="url"
                  />
                </div>
              ))}
            </div>
            <button
              className="rounded-lg bg-tertiary px-6 py-2.5 text-body-sm font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 disabled:opacity-60"
              disabled={testsPending}
              type="submit"
            >
              {testsPending ? "..." : admin.save}
            </button>
          </form>
        ) : (
          <PromptsPanel prompts={agentPrompts} />
        )}
      </div>
    </section>
  );
}
