"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type MediationChatMessage = {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
};

type MediationChatLabels = {
  you: string;
  agent: string;
  system: string;
  preparing: string;
};

type MediationChatProps = {
  messages: MediationChatMessage[];
  labels: MediationChatLabels;
  header: ReactNode;
  subheader?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function formatMessageTime(iso: string, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const localeTag = locale === "uk" ? "uk-UA" : "en-GB";
  return date.toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function MediationChatBubble({
  message,
  labels,
  locale,
}: {
  message: MediationChatMessage;
  labels: MediationChatLabels;
  locale: Locale;
}) {
  const isAgent = message.senderType === "agent";
  const isSystem = message.senderType === "system";
  const time = formatMessageTime(message.createdAt, locale);

  if (isSystem) {
    return (
      <div className="flex justify-center px-2 py-1">
        <span className="max-w-[90%] rounded-full bg-black/[0.06] px-3 py-1 text-center text-[12px] leading-snug text-on-surface-variant">
          {message.content}
        </span>
      </div>
    );
  }

  const senderLabel = message.isOwn ? labels.you : isAgent ? labels.agent : labels.system;

  return (
    <div className={cn("flex px-2 py-0.5", message.isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[min(85%,28rem)] px-3 pb-1.5 pt-2 shadow-sm",
          message.isOwn
            ? "rounded-[18px] rounded-br-[4px] bg-party-a text-white"
            : isAgent
              ? "rounded-[18px] rounded-bl-[4px] border border-hair/70 bg-white"
              : "rounded-[18px] rounded-bl-[4px] bg-white border border-hair/70",
        )}
      >
        {!message.isOwn ? (
          <p
            className={cn(
              "mb-0.5 text-[12px] font-semibold leading-tight",
              isAgent ? "text-law" : "text-party-b",
            )}
          >
            {senderLabel}
          </p>
        ) : null}
        <p
          className={cn(
            "whitespace-pre-wrap text-[15px] leading-[1.35]",
            message.isOwn ? "text-white" : "text-on-surface",
          )}
        >
          {message.content}
        </p>
        <p
          className={cn(
            "mt-1 text-right text-[11px] leading-none",
            message.isOwn ? "text-white/75" : "text-on-surface-variant/80",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

export function MediationChat({
  messages,
  labels,
  header,
  subheader,
  footer,
  className,
}: MediationChatProps) {
  const { locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages.at(-1)?.id]);

  return (
    <div
      className={cn(
        "flex h-[min(560px,calc(100dvh-14rem))] flex-col overflow-hidden rounded-2xl border border-hair bg-surface shadow-[0_8px_30px_rgba(22,35,59,0.06)]",
        className,
      )}
    >
      <div className="shrink-0 border-b border-hair">{header}</div>
      {subheader ? <div className="shrink-0 border-b border-hair">{subheader}</div> : null}

      <div
        className="mediation-chat-bg custom-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-3"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <p className="px-4 py-8 text-center text-body-md text-on-surface-variant">{labels.preparing}</p>
        ) : (
          messages.map((message) => (
            <MediationChatBubble key={message.id} labels={labels} locale={locale} message={message} />
          ))
        )}
        <div ref={endRef} />
      </div>

      {footer ? <div className="shrink-0 border-t border-hair bg-surface">{footer}</div> : null}
    </div>
  );
}

type MediationChatComposerProps = {
  value: string;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  pending?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function MediationChatComposer({
  value,
  placeholder,
  sendLabel,
  disabled = false,
  pending = false,
  onChange,
  onSend,
}: MediationChatComposerProps) {
  const canSend = !disabled && !pending && value.trim().length > 0;

  return (
    <div className="flex items-end gap-2 px-3 py-3">
      <textarea
        className="custom-scrollbar max-h-32 min-h-[44px] flex-1 resize-none rounded-[22px] border border-hair bg-surface-container-high/80 px-4 py-2.5 text-[15px] leading-snug text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-law/50 focus:bg-white"
        disabled={disabled || pending}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={placeholder}
        rows={1}
        value={value}
      />
      <button
        aria-label={sendLabel}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-party-a text-white transition-all hover:bg-party-a/90 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canSend}
        onClick={onSend}
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]">send</span>
      </button>
    </div>
  );
}

export function MediationChatStatusBar({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "own" | "other";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-4 py-2.5",
        tone === "other" && "bg-party-a-fill/40",
        tone === "own" && "bg-law-fill/50",
        tone === "neutral" && "bg-surface-container-high/90",
      )}
    >
      {children}
    </div>
  );
}
