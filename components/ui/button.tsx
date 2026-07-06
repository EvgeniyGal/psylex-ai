import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-[14.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-law focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "border border-ink bg-ink px-[22px] py-2.5 text-white hover:bg-[#0f1a2e]",
        outline:
          "border border-hair bg-surface-container px-[22px] py-2.5 text-ink hover:border-[#c9ced6]",
        ghost: "border border-hair bg-surface-container px-4 py-2 text-ink hover:border-[#c9ced6]",
        law: "border border-law-line bg-law-fill px-4 py-1.5 text-ink hover:border-[#d9c07a]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
