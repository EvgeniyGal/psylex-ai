"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  deleteRoom,
  updateParticipantMeta,
  updateRoomMeta,
} from "@/app/admin/rooms/actions";
import { CredentialActions, CredentialField } from "@/components/credential-actions";
import { useLocale } from "@/components/locale-provider";
import { formatDateTime } from "@/lib/format-datetime";

export type RoomUserRow = {
  id: string;
  login: string;
  password: string;
  role: "admin" | "mediator" | "side1" | "side2";
  title: string;
  description: string;
  roomId: string | null;
};

export type RoomDetailRow = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
};

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

function roleIcon(role: string) {
  if (role === "side1") return "person";
  if (role === "side2") return "balance";
  return "group";
}

function ParticipantSection({
  participant,
  readOnly,
}: {
  participant: RoomUserRow;
  readOnly: boolean;
}) {
  const { admin } = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState(participant.title);
  const [description, setDescription] = useState(participant.description);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(participant.title);
    setDescription(participant.description);
  }, [participant]);

  const isDirty = title !== participant.title || description !== participant.description;

  const onSave = (formData: FormData) => {
    startTransition(async () => {
      await updateParticipantMeta(formData);
      router.refresh();
    });
  };

  return (
    <section className="glass-panel rounded-xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={
            participant.role === "side1"
              ? "flex h-10 w-10 items-center justify-center rounded bg-primary-container"
              : participant.role === "side2"
                ? "flex h-10 w-10 items-center justify-center rounded bg-on-tertiary-container/20"
                : "flex h-10 w-10 items-center justify-center rounded bg-tertiary/20"
          }
        >
          <span
            className={
              participant.role === "side1"
                ? "material-symbols-outlined text-primary"
                : "material-symbols-outlined text-tertiary"
            }
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {roleIcon(participant.role)}
          </span>
        </div>
        <p className="font-display text-headline-md text-on-surface">
          {admin.roles[participant.role] ?? participant.role}
        </p>
      </div>

      <form action={onSave} className="mb-5 space-y-3">
        <input name="userId" type="hidden" value={participant.id} />
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.titleLabel}</label>
          {readOnly ? (
            <p className="text-body-md text-on-surface">{participant.title}</p>
          ) : (
            <input
              className={inputClass}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.descriptionLabel}</label>
          {readOnly ? (
            <p className="text-body-sm text-on-surface-variant">{participant.description}</p>
          ) : (
            <textarea
              className={inputClass}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={2}
              value={description}
            />
          )}
        </div>
        {!readOnly ? (
          <button
            className="rounded border border-tertiary px-4 py-1.5 text-body-sm font-semibold text-tertiary transition-colors hover:bg-tertiary hover:text-on-tertiary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || !isDirty}
            type="submit"
          >
            {pending ? "..." : admin.saveChanges}
          </button>
        ) : null}
      </form>

      {!readOnly ? (
        <>
          <div className="space-y-4">
            <CredentialField label={admin.loginLabel} value={participant.login} />
            <CredentialField label={admin.passwordLabel} value={participant.password} />
          </div>
          <CredentialActions
            login={participant.login}
            password={participant.password}
            role={participant.role}
            userId={participant.id}
          />
        </>
      ) : null}
    </section>
  );
}

export function RoomDetailContent({
  room,
  participants,
  pipelineStatus,
  basePath = "/admin/rooms",
  readOnly = false,
}: {
  room: RoomDetailRow;
  participants: RoomUserRow[];
  pipelineStatus: string;
  basePath?: string;
  readOnly?: boolean;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description);
  const [roomPending, startRoomTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    setTitle(room.title);
    setDescription(room.description);
  }, [room]);

  const isRoomDirty = title !== room.title || description !== room.description;

  const side1 = participants.find((p) => p.role === "side1");
  const side2 = participants.find((p) => p.role === "side2");
  const mediator = participants.find((p) => p.role === "mediator");
  const orderedParticipants = [side1, side2, mediator].filter(Boolean) as RoomUserRow[];

  const onSaveRoom = (formData: FormData) => {
    startRoomTransition(async () => {
      await updateRoomMeta(formData);
      router.refresh();
    });
  };

  const onDelete = (formData: FormData) => {
    startDeleteTransition(async () => {
      await deleteRoom(formData);
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

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="font-display text-headline-lg text-on-surface">{room.title}</h3>
            <span className="status-chip-active flex items-center gap-1 rounded px-3 py-1 font-display text-label-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" />
              {admin.pipelineStatus}: {pipelineStatus}
            </span>
            {!readOnly ? (
              <Link
                className="rounded-lg border border-outline-variant/30 px-3 py-1 text-label-md text-on-surface hover:border-tertiary"
                href={`${basePath}/${room.id}/pipeline-log`}
              >
                {admin.pipelineLog}
              </Link>
            ) : null}
          </div>
          <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            {formatDateTime(room.createdAt, locale)}
          </p>
        </div>
      </div>

      {readOnly ? (
        <div className="glass-panel space-y-4 rounded-xl p-6">
          <h4 className="font-display text-headline-md text-on-surface">{admin.roomDetails}</h4>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.roomTitleLabel}</p>
            <p className="text-body-md text-on-surface">{room.title}</p>
          </div>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.roomDescriptionLabel}</p>
            <p className="text-body-sm text-on-surface-variant">{room.description}</p>
          </div>
        </div>
      ) : (
        <form
          action={onSaveRoom}
          className="glass-panel space-y-4 rounded-xl p-6"
        >
          <input name="roomId" type="hidden" value={room.id} />
          <h4 className="font-display text-headline-md text-on-surface">{admin.roomDetails}</h4>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomTitleLabel}</label>
            <input
              className={inputClass}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.roomDescriptionLabel}</label>
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
            className="rounded-lg border border-tertiary px-5 py-2 text-body-sm font-semibold text-tertiary transition-colors hover:bg-tertiary hover:text-on-tertiary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={roomPending || !isRoomDirty}
            type="submit"
          >
            {roomPending ? "..." : admin.saveChanges}
          </button>
        </form>
      )}

      <div>
        <h4 className="mb-4 font-display text-headline-md text-on-surface">{admin.participants}</h4>
        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          {orderedParticipants.map((participant) => (
            <ParticipantSection key={participant.id} participant={participant} readOnly={readOnly} />
          ))}
        </div>
      </div>

      {!readOnly ? (
        <div className="glass-panel rounded-xl border border-error/20 p-6">
          {!confirmDelete ? (
            <button
              className="flex items-center gap-2 text-body-sm font-semibold text-error transition-opacity hover:opacity-80"
              onClick={() => setConfirmDelete(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              {admin.deleteRoom}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface">{admin.deleteRoomConfirm}</p>
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
                  <input name="roomId" type="hidden" value={room.id} />
                  <button
                    className="rounded-lg bg-error px-4 py-2 text-body-sm font-semibold text-white disabled:opacity-60"
                    disabled={deletePending}
                    type="submit"
                  >
                    {deletePending ? "..." : admin.deleteRoom}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
