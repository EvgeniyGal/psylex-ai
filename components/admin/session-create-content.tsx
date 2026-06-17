"use client";

import Link from "next/link";
import { useTransition } from "react";
import { createSession } from "@/app/admin/sessions/actions";
import { useLocale } from "@/components/locale-provider";

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

export function SessionCreateContent() {
  const { admin } = useLocale();
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createSession(formData);
    });
  };

  return (
    <section className="space-y-stack-lg">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary transition-colors hover:text-on-surface"
        href="/admin/sessions"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToSessions}
      </Link>

      <div>
        <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.newSession}</h3>
        <p className="max-w-xl text-on-surface-variant">{admin.createSessionSubtitle}</p>
      </div>

      <form action={onSubmit} className="space-y-stack-md">
        <fieldset className="glass-panel space-y-4 rounded-xl p-6">
          <legend className="mb-1 font-display text-headline-md text-on-surface">{admin.sessionDetails}</legend>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.sessionTitleLabel}</label>
            <input className={inputClass} name="title" placeholder={admin.sessionTitleLabel} required />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.sessionDescriptionLabel}</label>
            <textarea
              className={inputClass}
              name="description"
              placeholder={admin.sessionDescriptionLabel}
              required
              rows={3}
            />
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          <fieldset className="glass-panel space-y-4 rounded-xl p-6">
            <legend className="mb-1 font-display text-headline-md text-primary">{admin.roles.plaintiff}</legend>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.plaintiffTitleLabel}</label>
              <input className={inputClass} name="plaintiffTitle" placeholder={admin.plaintiffTitleLabel} required />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.plaintiffDescriptionLabel}</label>
              <textarea
                className={inputClass}
                name="plaintiffDescription"
                placeholder={admin.plaintiffDescriptionLabel}
                required
                rows={3}
              />
            </div>
          </fieldset>

          <fieldset className="glass-panel space-y-4 rounded-xl p-6">
            <legend className="mb-1 font-display text-headline-md text-tertiary">{admin.roles.defendant}</legend>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.defendantTitleLabel}</label>
              <input className={inputClass} name="defendantTitle" placeholder={admin.defendantTitleLabel} required />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.defendantDescriptionLabel}</label>
              <textarea
                className={inputClass}
                name="defendantDescription"
                placeholder={admin.defendantDescriptionLabel}
                required
                rows={3}
              />
            </div>
          </fieldset>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-6">
          <Link
            className="rounded-lg border border-outline-variant/30 px-5 py-2 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            href="/admin/sessions"
          >
            {admin.cancel}
          </Link>
          <button
            className="flex items-center gap-2 rounded-lg bg-tertiary px-8 py-2.5 text-body-sm font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {pending ? "..." : admin.createSession}
          </button>
        </div>
      </form>
    </section>
  );
}
