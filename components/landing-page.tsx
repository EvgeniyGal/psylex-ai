"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteHeader } from "@/components/site-header";
import { useLocale } from "@/components/locale-provider";
import { AnimateOnScroll, StaggerContainer } from "@/components/ui/animate-on-scroll";
import {
  HeroGradient,
  FloatingArc,
  DotGrid,
  SectionGradient,
} from "@/components/ui/decorative-shapes";
import {
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
} from "@/lib/motion";

const beatBorders = ["border-t-med", "border-t-law", "border-t-risk"] as const;

function WorkflowSteps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <motion.div
          className="flex gap-4"
          key={step.title}
          variants={fadeInUp}
        >
          <div className="font-display text-sm italic text-law">{index + 1}.</div>
          <div>
            <h4 className="font-display text-[15.5px] leading-snug text-ink">{step.title}</h4>
            <p className="mt-1 text-body-sm text-ink-soft">{step.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function LandingPage() {
  const { landing: t } = useLocale();
  const beats = [
    { key: "b1", k: "01", title: t.win1, border: beatBorders[0] },
    { key: "b2", k: "02", title: t.win2, border: beatBorders[1] },
    { key: "b3", k: "03", title: t.win3, border: beatBorders[2] },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        showUplBanner
        trailing={
          <>
            <LocaleSwitcher />
            <Link
              className="hidden text-[13px] font-medium tracking-wide text-ink-soft transition-colors hover:text-ink md:block"
              href="/login"
            >
              {t.login}
            </Link>
          </>
        }
      />

      <main className="flex-grow px-margin-mobile py-6 md:px-margin-desktop md:py-10">
        <section className="relative mx-auto max-w-landing pt-6 md:pt-12">
          <HeroGradient />
          <FloatingArc className="right-0 top-8 hidden lg:block" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
            }}
          >
            <motion.h1
              className="wordmark relative z-10 mb-2 text-center font-display text-display-lg text-ink"
              variants={fadeInUp}
            >
              {t.headline}
              {t.headlineAccent ? (
                <>
                  <br />
                  <em className="text-law">{t.headlineAccent}</em>
                </>
              ) : null}
            </motion.h1>

            <motion.p
              className="relative z-10 mx-auto mb-6 max-w-[620px] text-center text-body-md text-ink-soft"
              variants={fadeInUp}
            >
              {t.subheadline}
            </motion.p>

            <motion.div
              className="relative z-10 mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
              variants={fadeInUp}
            >
              <Link
                className="gold-shimmer-border inline-flex items-center gap-2.5 rounded-full px-[34px] py-[13px] text-base font-medium text-white transition-colors active:translate-y-px"
                href="/login"
              >
                {t.start}
                <span className="font-display italic text-law-mark">→</span>
              </Link>
              <Link
                className="btn-secondary px-6 py-3 text-body-md sm:w-auto"
                href="/login"
              >
                {t.mediators}
              </Link>
            </motion.div>
          </motion.div>

          <StaggerContainer className="mb-8 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {beats.map((beat) => (
              <motion.div
                className={`card-lift rounded border border-hair border-t-[3px] bg-surface-container px-[18px] py-4 ${beat.border}`}
                key={beat.key}
                variants={scaleIn}
              >
                <div className="mb-1 font-display text-sm italic text-ink-soft">{beat.k}</div>
                <h3 className="mb-1.5 font-display text-headline-md text-ink">{beat.title}</h3>
              </motion.div>
            ))}
          </StaggerContainer>

          <AnimateOnScroll>
            <p className="mx-auto mb-8 max-w-3xl text-center font-display text-lg italic text-ink-soft md:text-xl">
              {t.winFooter}
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="mx-auto max-w-[760px] rounded-r-[10px] border border-hair border-l-[3px] border-l-ink bg-[#F0F2F5] px-[18px] py-3.5 text-[12.5px] leading-snug text-ink-soft">
              <b className="font-semibold text-ink">{t.landingUplCardLead}</b>
              {t.landingUplCardBody}
            </div>
          </AnimateOnScroll>
        </section>

        <section className="relative mx-auto mt-16 max-w-container-max">
          <SectionGradient />
          <StaggerContainer className="grid grid-cols-1 gap-3.5 lg:grid-cols-5" staggerDelay={0.15}>
            <motion.div
              className="card-lift rounded border border-hair border-t-[3px] border-t-party-a bg-surface-container p-5 lg:col-span-3"
              variants={slideInLeft}
            >
              <h3 className="mb-4 text-center font-display text-headline-md text-ink">{t.psylexTitle}</h3>
              <ul className="mx-auto max-w-sm space-y-3">
                {t.psylexPoints.map((point) => (
                  <li className="flex items-start text-body-sm text-ink-soft" key={point}>
                    <span className="material-symbols-outlined mr-2 mt-0.5 text-base text-party-a">check</span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="card-lift rounded border border-hair border-t-[3px] border-t-risk bg-surface-container p-5 lg:col-span-2"
              variants={slideInRight}
            >
              <h3 className="mb-4 text-center font-display text-headline-md text-ink">{t.attorneyTitle}</h3>
              <ul className="mx-auto max-w-sm space-y-3">
                {t.attorneyPoints.map((point) => (
                  <li className="flex items-start text-body-sm text-ink-soft" key={point}>
                    <span className="material-symbols-outlined mr-2 mt-0.5 text-base text-risk">close</span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </StaggerContainer>
        </section>

        <section className="relative mx-auto mt-16 max-w-container-max" id="how-it-works">
          <DotGrid className="-right-4 top-0 hidden lg:block" />

          <AnimateOnScroll>
            <div className="mb-3 flex items-center gap-2.5 text-eyebrow uppercase text-ink-soft">
              <span className="h-[7px] w-[7px] rounded-full bg-law" />
              <span>{t.howTitle}</span>
            </div>
            <h2 className="mb-8 font-display text-headline-lg text-ink">{t.howTitle}</h2>
          </AnimateOnScroll>

          <StaggerContainer className="grid grid-cols-1 gap-4 lg:grid-cols-2" staggerDelay={0.18}>
            <motion.div
              className="card-lift rounded border border-hair border-t-[3px] border-t-party-b bg-surface-container p-5"
              variants={scaleIn}
            >
              <h3 className="mb-4 font-display text-headline-md text-ink">{t.modeA}</h3>
              <WorkflowSteps steps={t.modeASteps} />
            </motion.div>
            <motion.div
              className="card-lift rounded border border-hair border-t-[3px] border-t-med bg-surface-container p-5"
              variants={scaleIn}
            >
              <h3 className="mb-4 font-display text-headline-md text-ink">{t.modeB}</h3>
              <WorkflowSteps steps={t.modeBSteps} />
            </motion.div>
          </StaggerContainer>
        </section>
      </main>
    </div>
  );
}
