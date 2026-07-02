import { getPlatformSettings } from "@/lib/platform-settings";
import { SettingsContent } from "@/components/admin/settings-content";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return <SettingsContent settings={settings} />;
}
