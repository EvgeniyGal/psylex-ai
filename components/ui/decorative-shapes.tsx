"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type DecoProps = { className?: string };

export function HeroGradient({ className }: DecoProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div className="gradient-hero absolute inset-0" />
      <motion.div
        className="absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full opacity-[0.045]"
        style={{
          background:
            "radial-gradient(circle, var(--law) 0%, transparent 70%)",
        }}
        animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-16 top-1/3 h-[320px] w-[320px] rounded-full opacity-[0.035]"
        style={{
          background:
            "radial-gradient(circle, var(--law) 0%, transparent 70%)",
        }}
        animate={{ y: [0, 10, 0], x: [0, -6, 0] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}

export function FloatingArc({ className }: DecoProps) {
  return (
    <motion.svg
      className={cn(
        "pointer-events-none absolute opacity-[0.08]",
        className,
      )}
      width="280"
      height="140"
      viewBox="0 0 280 140"
      fill="none"
      aria-hidden="true"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M20 130 Q140 -20 260 130"
        stroke="var(--law)"
        strokeWidth="1.5"
        fill="none"
      />
    </motion.svg>
  );
}

export function DotGrid({ className }: DecoProps) {
  const rows = 6;
  const cols = 8;
  const gap = 28;
  return (
    <svg
      className={cn(
        "pointer-events-none absolute opacity-[0.12]",
        className,
      )}
      width={cols * gap}
      height={rows * gap}
      aria-hidden="true"
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        return (
          <circle
            key={i}
            cx={c * gap + gap / 2}
            cy={r * gap + gap / 2}
            r="1.5"
            fill="var(--ink-soft)"
          />
        );
      })}
    </svg>
  );
}

export function SectionGradient({ className }: DecoProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 gradient-section",
        className,
      )}
      aria-hidden="true"
    />
  );
}
