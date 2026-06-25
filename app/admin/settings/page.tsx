import { getAgentPrompts } from "@/lib/agent-prompts";
import { getPlatformSettings } from "@/lib/platform-settings";
import { SettingsContent } from "@/components/admin/settings-content";

export default async function AdminSettingsPage() {
  const [settings, agentPrompts] = await Promise.all([getPlatformSettings(), getAgentPrompts()]);
  return <SettingsContent agentPrompts={agentPrompts} settings={settings} />;
}
