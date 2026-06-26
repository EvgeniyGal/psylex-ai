"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { submitSituation } from "@/app/(participant)/room/actions";
import { useLocale } from "@/components/locale-provider";

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

export function SituationForm() {
  const { portal: t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      await submitSituation(formData);
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="glass-panel space-y-4 rounded-xl p-6">
      <h2 className="font-display text-headline-md text-on-surface">{t.roomSituationTitle}</h2>
      <div>
        <label className="mb-1 block text-body-sm text-on-surface-variant">{t.roomWhatHappened}</label>
        <textarea className={inputClass} name="whatHappened" required rows={4} />
      </div>
      <div>
        <label className="mb-1 block text-body-sm text-on-surface-variant">{t.roomWhyDispute}</label>
        <textarea className={inputClass} name="whyDispute" required rows={3} />
      </div>
      <div>
        <label className="mb-1 block text-body-sm text-on-surface-variant">{t.roomSupportingInfo}</label>
        <textarea className={inputClass} name="supportingInfo" rows={3} />
      </div>
      <button
        className="btn-primary px-6 py-3 font-display text-label-md disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "…" : t.roomSubmitSituation}
      </button>
    </form>
  );
}
