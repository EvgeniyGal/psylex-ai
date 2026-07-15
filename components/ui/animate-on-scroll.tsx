"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";

type AnimateOnScrollProps = {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  as?: "div" | "section" | "article";
  delay?: number;
  once?: boolean;
  amount?: number;
};

export function AnimateOnScroll({
  children,
  variants = fadeInUp,
  className,
  as = "div",
  delay = 0,
  once = true,
  amount = 0.2,
}: AnimateOnScrollProps) {
  const Component = motion.create(as);

  return (
    <Component
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={delay ? { delay } : undefined}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "article";
  staggerDelay?: number;
  once?: boolean;
  amount?: number;
};

export function StaggerContainer({
  children,
  className,
  as = "div",
  staggerDelay = 0.1,
  once = true,
  amount = 0.15,
}: StaggerContainerProps) {
  const Component = motion.create(as);

  return (
    <Component
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.05 } },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
