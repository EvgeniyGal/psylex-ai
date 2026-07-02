"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useLocale } from "@/components/locale-provider";
import {
  ROOM_JURISDICTIONS,
  type RoomJurisdiction,
  jurisdictionLabels,
} from "@/lib/room/jurisdiction";

export function JurisdictionSelectModal({
  open,
  onClose,
  basePath,
}: {
  open: boolean;
  onClose: () => void;
  basePath: string;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<RoomJurisdiction | null>(null);
  const labels = jurisdictionLabels(locale);

  const onContinue = () => {
    if (!selected) return;
    router.push(`${basePath}/new?jurisdiction=${selected}`);
    onClose();
  };

  const onModalClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal onClose={onModalClose} open={open} title={admin.jurisdictionModalTitle}>
      <div className="space-y-6">
        <p className="text-body-md text-on-surface-variant">{admin.jurisdictionModalSubtitle}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROOM_JURISDICTIONS.map((value) => {
            const active = selected === value;
            return (
              <button
                className={
                  active
                    ? "flex flex-col items-start gap-1 rounded-xl border-2 border-tertiary bg-tertiary/10 p-4 text-left transition-colors"
                    : "flex flex-col items-start gap-1 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-left transition-colors hover:border-tertiary/50"
                }
                key={value}
                onClick={() => setSelected(value)}
                type="button"
              >
                <span className="font-display text-headline-sm text-on-surface">{labels[value]}</span>
                <span className="text-body-sm text-on-surface-variant">
                  {value === "ukraine" ? admin.jurisdictionUkraineDesc : admin.jurisdictionUsaDesc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4">
          <button
            className="rounded-lg border border-outline-variant/30 px-5 py-2 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={onModalClose}
            type="button"
          >
            {admin.cancel}
          </button>
          <button
            className="rounded-lg bg-tertiary px-6 py-2 text-body-sm font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selected}
            onClick={onContinue}
            type="button"
          >
            {admin.continue}
          </button>
        </div>
      </div>
    </Modal>
  );
}
