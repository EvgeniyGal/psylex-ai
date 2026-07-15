"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteMediator, updateMediatorMeta } from "@/app/admin/mediators/actions";
import { CredentialActions, CredentialField } from "@/components/credential-actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";

export type MediatorRow = {
  id: string;
  login: string;
  password: string;
  role: string;
  title: string;
  description: string;
  roomId: string | null;
};

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

export function MediatorDetailContent({ mediator }: { mediator: MediatorRow }) {
  const { admin } = useLocale();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(mediator.title);
  const [description, setDescription] = useState(mediator.description);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    setTitle(mediator.title);
    setDescription(mediator.description);
  }, [mediator]);

  const isDirty = title !== mediator.title || description !== mediator.description;

  const onSave = (formData: FormData) => {
    startTransition(async () => {
      await updateMediatorMeta(formData);
      router.refresh();
    });
  };

  const onDelete = (formData: FormData) => {
    startDeleteTransition(async () => {
      await deleteMediator(formData);
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

      <h3 className="font-display text-headline-lg text-on-surface">{mediator.title}</h3>

      <form action={onSave} className="glass-panel space-y-4 rounded-xl p-6">
        <input name="mediatorId" type="hidden" value={mediator.id} />
        <h4 className="font-display text-headline-md text-on-surface">{admin.mediatorDetails}</h4>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.mediatorTitleLabel}</label>
          <input
            className={inputClass}
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.descriptionLabel}</label>
          <textarea
            className={inputClass}
            name="description"
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={3}
            value={description}
          />
        </div>
        <button
          className="btn-primary flex items-center gap-1.5 px-5 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending || !isDirty}
          type="submit"
        >
          {pending ? <Spinner size="sm" className="text-white" /> : null}
          {admin.saveMediator}
        </button>
      </form>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <h4 className="font-display text-headline-md text-on-surface">{admin.roles.mediator}</h4>
        <CredentialField label={admin.loginLabel} value={mediator.login} />
        <CredentialField label={admin.passwordLabel} value={mediator.password} />
        <CredentialActions
          login={mediator.login}
          password={mediator.password}
          role="mediator"
          userId={mediator.id}
        />
      </div>

      <div className="glass-panel rounded-xl border border-error/20 p-6">
        {!confirmDelete ? (
          <button
            className="flex items-center gap-2 text-body-sm font-semibold text-error transition-opacity hover:opacity-80"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {admin.deleteMediator}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface">{admin.deleteMediatorConfirm}</p>
            <div className="flex gap-3">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2 text-body-sm text-on-surface-variant hover:bg-surface-container-high"
                disabled={deletePending}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                {admin.cancel}
              </button>
              <form action={onDelete}>
                <input name="mediatorId" type="hidden" value={mediator.id} />
                <button
                  className="flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-body-sm font-semibold text-white disabled:opacity-60"
                  disabled={deletePending}
                  type="submit"
                >
                  {deletePending ? <Spinner size="sm" className="text-white" /> : null}
                  {admin.deleteMediator}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
