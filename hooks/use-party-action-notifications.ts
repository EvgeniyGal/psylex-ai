"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import type { PartyNotification } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";

type UsePartyActionNotificationsParams = {
  notification: PartyNotification | null | undefined;
  viewerRole: PartyRole | "mediator";
  enabled?: boolean;
};

function messageForType(
  type: PartyNotification["type"],
  t: ReturnType<typeof useLocale>["portal"],
) {
  switch (type) {
    case "session_scheduled":
      return t.modeBNotifyScheduled;
    case "start_window_open":
      return t.modeBNotifyStartWindow;
    case "peer_ready":
      return t.modeBNotifyPeerReady;
    case "session_started":
      return t.modeBNotifySessionStarted;
    case "question_received":
      return t.modeBNotifyQuestion;
    case "options_ready":
      return t.modeBNotifyOptions;
    case "compromise_ready":
      return t.modeBNotifyCompromise;
    case "agreement_ready":
      return t.modeBNotifyAgreement;
    case "session_completed":
      return t.modeBNotifyCompleted;
    default:
      return null;
  }
}

export function usePartyActionNotifications({
  notification,
  viewerRole,
  enabled = true,
}: UsePartyActionNotificationsParams) {
  const { portal: t } = useLocale();
  const seenRef = useRef<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !notification) return;
    if (seenRef.current === notification.id) return;

    const target = notification.targetRole ?? "all";
    if (target !== "all" && target !== viewerRole) return;

    seenRef.current = notification.id;
    const message = messageForType(notification.type, t);
    if (!message) return;

    toast.message(message);
    setBanner(message);
  }, [enabled, notification, t, viewerRole]);

  return { banner, clearBanner: () => setBanner(null) };
}
