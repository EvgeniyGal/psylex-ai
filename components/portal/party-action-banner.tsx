"use client";

type PartyActionBannerProps = {
  message: string | null;
  onDismiss?: () => void;
};

export function PartyActionBanner({ message, onDismiss }: PartyActionBannerProps) {
  if (!message) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-law/30 bg-law/10 px-4 py-3 text-body-sm text-on-surface">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-[20px] text-law">notifications_active</span>
        <p>{message}</p>
      </div>
      {onDismiss ? (
        <button
          className="shrink-0 text-on-surface-variant hover:text-on-surface"
          onClick={onDismiss}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      ) : null}
    </div>
  );
}
