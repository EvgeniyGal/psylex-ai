"use client";

import { toast } from "sonner";
import { formatCredentials } from "@/lib/credentials";
import { Button } from "@/components/ui/button";

export function CredentialActions({
  role,
  login,
  password,
}: {
  role: string;
  login: string;
  password: string;
}) {
  const text = formatCredentials({ role, login, password });

  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        toast.success("Shared");
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied for sharing");
  };

  return (
    <div className="mt-3 flex gap-2">
      <Button type="button" variant="outline" onClick={onCopy}>
        Copy Credentials
      </Button>
      <Button type="button" variant="outline" onClick={onShare}>
        Share / Magic Link
      </Button>
    </div>
  );
}
