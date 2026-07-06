"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function ModalOverlay({
  open,
  onClose,
  children,
  className,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-[100] flex items-center justify-center p-5", className)}
      role="presentation"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-[rgba(22,35,59,0.42)]"
        onClick={onClose}
        type="button"
      />
      <div className={cn("relative z-10 w-full max-w-lg", panelClassName)} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      role="dialog"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-[rgba(22,35,59,0.42)]"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-hair bg-surface-container shadow-modal",
          className,
        )}
        ref={panelRef}
      >
        <div className="flex items-center justify-between gap-3 border-b border-hair px-6 py-4">
          <h2 className="font-display text-[22px] font-medium leading-tight text-ink" id="modal-title">
            {title}
          </h2>
          <button
            className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full border border-hair bg-paper text-[13px] text-ink-soft transition-colors hover:border-[#c9ced6] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-law focus-visible:outline-offset-2"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="custom-scrollbar overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
