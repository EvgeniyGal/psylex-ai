import { getAllLegalDocuments } from "@/lib/rag/documents";
import { getPlatformSettings } from "@/lib/platform-settings";
import { SettingsContent } from "@/components/admin/settings-content";

export default async function AdminSettingsPage() {
  const [settings, documents] = await Promise.all([getPlatformSettings(), getAllLegalDocuments()]);
  return <SettingsContent documents={documents} settings={settings} />;
}
