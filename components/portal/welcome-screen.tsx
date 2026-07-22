"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { markWelcomeSeen } from "@/app/onboarding/actions";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import { fadeInUp } from "@/lib/motion";
import type { ParticipantRole } from "@/lib/participant-roles";

type WelcomeScreenProps = {
  role: ParticipantRole;
  review?: boolean;
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

export function WelcomeScreen({ role, review = false }: WelcomeScreenProps) {
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);

  return (
    <PortalPageShell flowStep={0} showStepRail={review}>
      <main className="relative flex flex-grow items-center justify-center px-margin-mobile pb-12 md:px-margin-desktop">
        <div className="pointer-events-none absolute inset-0 gradient-hero" aria-hidden="true" />

        <motion.div
          className="relative z-10 max-w-2xl space-y-stack-lg text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-stack-md">
            <motion.div className="space-y-stack-sm text-center" variants={fadeInUp}>
              <span
                className="material-symbols-outlined mb-2 text-5xl text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
              <h1 className="font-display text-display-lg text-ink">
                {roleCopy.welcomeTitle}
              </h1>
              <p className="mx-auto max-w-xl text-body-lg text-ink-soft">
                {roleCopy.welcomeBody}
              </p>
            </motion.div>
          </div>

          <motion.div className="pt-8" variants={fadeInUp}>
            {review ? (
              <FlowReviewNext step={0} />
            ) : (
              <form action={markWelcomeSeen}>
                <button
                  className="btn-primary mx-auto flex items-center gap-2 px-8 py-4"
                  type="submit"
                >
                  {roleCopy.welcomeCta}
                  <span className="font-display italic text-law-mark">→</span>
                </button>
              </form>
            )}
            <p className="mt-4 flex items-center justify-center gap-2 text-body-sm text-ink-soft">
              <span className="material-symbols-outlined text-xs">lock</span>
              {t.confidential}
            </p>
            {review ? (
              <p className="mt-6">
                <Link className="text-body-sm text-on-surface-variant underline" href="/room">
                  {t.flowReviewBackToCurrent}
                </Link>
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      </main>
    </PortalPageShell>
  );
}
