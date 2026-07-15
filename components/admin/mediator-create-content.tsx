"use client";

import Link from "next/link";
import { useTransition } from "react";
import { createMediator } from "@/app/admin/mediators/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

export function MediatorCreateContent() {
  const { admin } = useLocale();
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createMediator(formData);
    });
  };

  return (
    <section className="space-y-stack-lg">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary transition-colors hover:text-on-surface"
        href="/admin/mediators"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToMediators}
      </Link>

      <div>
        <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.addMediator}</h3>
        <p className="max-w-xl text-on-surface-variant">{admin.createMediatorSubtitle}</p>
      </div>

      <form action={onSubmit} className="space-y-stack-md">
        <fieldset className="glass-panel space-y-4 rounded-xl p-6">
          <legend className="mb-1 font-display text-headline-md text-on-surface">{admin.mediatorDetails}</legend>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.mediatorTitleLabel}</label>
            <input
              className={inputClass}
              name="title"
              placeholder={admin.mediatorTitlePlaceholder}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.descriptionLabel}</label>
            <textarea
              className={inputClass}
              name="description"
              placeholder={admin.mediatorDescPlaceholder}
              required
              rows={3}
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-6">
          <Link
            className="rounded-lg border border-outline-variant/30 px-5 py-2 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            href="/admin/mediators"
          >
            {admin.cancel}
          </Link>
          <button
            className="btn-primary flex items-center gap-2 px-8 py-2.5 text-body-sm disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? <Spinner size="sm" className="text-white" /> : <span className="material-symbols-outlined text-[18px]">person_add</span>}
            {admin.addMediator}
          </button>
        </div>
      </form>
    </section>
  );
}
