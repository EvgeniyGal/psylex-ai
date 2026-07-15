"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { useParticipantFlowProgress } from "@/components/portal/participant-flow-progress-provider";
import {
  PARTICIPANT_FLOW_STEP_COUNT,
  canNavigateToFlowStep,
  flowStepPathForRail,
  type ParticipantFlowStepId,
} from "@/lib/participant-flow";
import { cn } from "@/lib/utils";

type ParticipantStepRailProps = {
  currentStep: ParticipantFlowStepId;
};

const stepButtonClass =
  "relative whitespace-nowrap border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-law focus-visible:-outline-offset-2";

export function ParticipantStepRail({ currentStep }: ParticipantStepRailProps) {
  const { portal: t } = useLocale();
  const maxReachedStep = useParticipantFlowProgress();

  return (
    <nav
      aria-label={t.participantFlowNavLabel}
      className="overflow-x-auto border-b border-hair bg-surface px-gutter scrollbar-thin"
    >
      <div className="mx-auto flex w-full max-w-container-max justify-center gap-0.5">
        {Array.from({ length: PARTICIPANT_FLOW_STEP_COUNT }, (_, index) => {
          const stepId = index as ParticipantFlowStepId;
          const isCurrent = stepId === currentStep;
          const allDone = maxReachedStep >= ((PARTICIPANT_FLOW_STEP_COUNT - 1) as ParticipantFlowStepId);
          const isCompleted = stepId < maxReachedStep || (allDone && stepId <= maxReachedStep);
          const isReachable = stepId <= maxReachedStep;
          const canNavigate = canNavigateToFlowStep(stepId, currentStep, maxReachedStep);
          const label = t.participantFlowSteps[stepId];

          const content = (
            <>
              {isCompleted ? (
                <motion.span
                  className="material-symbols-outlined mr-1 text-sm text-party-a"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </motion.span>
              ) : (
                <span className="mr-1.5 font-display italic text-law">{stepId}</span>
              )}
              {label}
              {isCurrent && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-law"
                  layoutId="step-rail-indicator"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </>
          );

          if (canNavigate) {
            return (
              <Link
                key={stepId}
                className={cn(
                  stepButtonClass,
                  "border-transparent text-ink-soft hover:border-law/40 hover:text-ink",
                )}
                href={flowStepPathForRail(stepId)}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={stepId}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={!isReachable}
              className={cn(
                stepButtonClass,
                isCurrent
                  ? "cursor-default border-transparent text-ink"
                  : isReachable
                    ? "cursor-default border-transparent text-ink-soft"
                    : "cursor-default border-transparent text-ink-soft/50",
              )}
              disabled
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
