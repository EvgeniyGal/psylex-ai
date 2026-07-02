"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createRoom } from "@/app/admin/rooms/actions";
import { useLocale } from "@/components/locale-provider";
import type { RoomJurisdiction } from "@/lib/room/jurisdiction";
import { jurisdictionLabels } from "@/lib/room/jurisdiction";

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

export function RoomCreateContent({
  jurisdiction,
  basePath = "/admin/rooms",
}: {
  jurisdiction: RoomJurisdiction;
  basePath?: string;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const jurisdictionDisplay = jurisdictionLabels(locale)[jurisdiction];

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createRoom(formData);
    });
  };

  return (
    <section className="space-y-stack-lg">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary transition-colors hover:text-on-surface"
        href={basePath}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToRooms}
      </Link>

      <div>
        <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.newRoom}</h3>
        <p className="max-w-xl text-on-surface-variant">{admin.createRoomSubtitle}</p>
      </div>

      <div className="glass-panel inline-flex items-center gap-2 rounded-xl px-4 py-3">
        <span className="material-symbols-outlined text-tertiary">gavel</span>
        <span className="text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}:</span>
        <span className="text-body-sm font-semibold text-on-surface">{jurisdictionDisplay}</span>
        <button
          className="ml-2 text-body-sm font-semibold text-tertiary hover:underline"
          onClick={() => router.push(basePath)}
          type="button"
        >
          {admin.changeJurisdiction}
        </button>
      </div>

      <form action={onSubmit} className="space-y-stack-md">
        <input name="jurisdiction" type="hidden" value={jurisdiction} />

        <fieldset className="glass-panel space-y-4 rounded-xl p-6">
          <legend className="mb-1 font-display text-headline-md text-on-surface">{admin.roomDetails}</legend>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomTitleLabel}</label>
            <input className={inputClass} name="title" placeholder={admin.roomTitleLabel} required />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomDescriptionLabel}</label>
            <textarea
              className={inputClass}
              name="description"
              placeholder={admin.roomDescriptionLabel}
              required
              rows={3}
            />
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          <fieldset className="glass-panel space-y-4 rounded-xl p-6">
            <legend className="mb-1 font-display text-headline-md text-primary">{admin.roles.side1}</legend>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.side1TitleLabel}</label>
              <input className={inputClass} name="side1Title" placeholder={admin.side1TitleLabel} required />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.side1DescriptionLabel}</label>
              <textarea
                className={inputClass}
                name="side1Description"
                placeholder={admin.side1DescriptionLabel}
                required
                rows={3}
              />
            </div>
          </fieldset>

          <fieldset className="glass-panel space-y-4 rounded-xl p-6">
            <legend className="mb-1 font-display text-headline-md text-tertiary">{admin.roles.side2}</legend>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.side2TitleLabel}</label>
              <input className={inputClass} name="side2Title" placeholder={admin.side2TitleLabel} required />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.side2DescriptionLabel}</label>
              <textarea
                className={inputClass}
                name="side2Description"
                placeholder={admin.side2DescriptionLabel}
                required
                rows={3}
              />
            </div>
          </fieldset>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-6">
          <Link
            className="rounded-lg border border-outline-variant/30 px-5 py-2 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            href={basePath}
          >
            {admin.cancel}
          </Link>
          <button
            className="flex items-center gap-2 rounded-lg bg-tertiary px-8 py-2.5 text-body-sm font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {pending ? "..." : admin.createRoom}
          </button>
        </div>
      </form>
    </section>
  );
}
