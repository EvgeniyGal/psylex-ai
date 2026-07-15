"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createRoom } from "@/app/admin/rooms/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import {
  USA_SUB_JURISDICTIONS_SORTED,
  getUsaSubJurisdictionLabel,
  type UsaSubJurisdiction,
} from "@/lib/rag/usa-jurisdictions";
import {
  ROOM_JURISDICTIONS,
  jurisdictionLabels,
  type RoomJurisdiction,
} from "@/lib/room/jurisdiction";

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

export function RoomCreateContent({ basePath = "/admin/rooms" }: { basePath?: string }) {
  const { admin, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [jurisdiction, setJurisdiction] = useState<RoomJurisdiction | "">("");
  const [usaSubJurisdiction, setUsaSubJurisdiction] = useState<"" | UsaSubJurisdiction>("");
  const labels = jurisdictionLabels(locale);

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

      <form action={onSubmit} className="space-y-stack-md">
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
          <div>
            <label className="mb-2 block text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</label>
            <p className="mb-3 text-body-sm text-on-surface-variant">{admin.jurisdictionFieldHelp}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROOM_JURISDICTIONS.map((value) => (
                <label
                  className="flex cursor-pointer flex-col items-start gap-1 rounded border border-hair bg-paper p-4 transition-colors has-[:checked]:border-law has-[:checked]:bg-law-fill"
                  key={value}
                >
                  <span className="flex w-full items-center gap-2">
                    <input
                      checked={jurisdiction === value}
                      className="h-4 w-4 accent-tertiary"
                      name="jurisdiction"
                      onChange={() => {
                        setJurisdiction(value);
                        if (value !== "usa") setUsaSubJurisdiction("");
                      }}
                      required
                      type="radio"
                      value={value}
                    />
                    <span className="font-display text-headline-sm text-on-surface">{labels[value]}</span>
                  </span>
                  <span className="pl-6 text-body-sm text-on-surface-variant">
                    {value === "ukraine" ? admin.jurisdictionUkraineDesc : admin.jurisdictionUsaDesc}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {jurisdiction === "usa" ? (
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomUsaSubJurisdiction}</label>
              <p className="mb-2 text-body-sm text-on-surface-variant">{admin.roomUsaSubJurisdictionHelp}</p>
              <select
                className={inputClass}
                name="usaSubJurisdiction"
                onChange={(event) => setUsaSubJurisdiction(event.target.value as UsaSubJurisdiction)}
                required
                value={usaSubJurisdiction}
              >
                <option disabled value="">
                  —
                </option>
                {USA_SUB_JURISDICTIONS_SORTED.map((code) => (
                  <option key={code} value={code}>
                    {getUsaSubJurisdictionLabel(code, locale)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </fieldset>

        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          <fieldset className="glass-panel space-y-4 rounded-xl p-6">
            <legend className="mb-1 font-display text-headline-md text-primary">{admin.roles.party_a}</legend>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.partyATitleLabel}</label>
              <input className={inputClass} name="partyATitle" placeholder={admin.partyATitleLabel} required />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.partyADescriptionLabel}</label>
              <textarea
                className={inputClass}
                name="partyADescription"
                placeholder={admin.partyADescriptionLabel}
                required
                rows={3}
              />
            </div>
          </fieldset>

          <fieldset className="glass-panel space-y-4 rounded-xl p-6">
            <legend className="mb-1 font-display text-headline-md text-tertiary">{admin.roles.party_b}</legend>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.partyBTitleLabel}</label>
              <input className={inputClass} name="partyBTitle" placeholder={admin.partyBTitleLabel} required />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.partyBDescriptionLabel}</label>
              <textarea
                className={inputClass}
                name="partyBDescription"
                placeholder={admin.partyBDescriptionLabel}
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
            className="btn-primary flex items-center gap-2 px-8 py-2.5 text-body-sm disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? <Spinner size="sm" className="text-white" /> : <span className="material-symbols-outlined text-[18px]">add</span>}
            {admin.createRoom}
          </button>
        </div>
      </form>
    </section>
  );
}
