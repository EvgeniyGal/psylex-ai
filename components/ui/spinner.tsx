import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
} as const;

type SpinnerProps = {
  size?: keyof typeof sizeMap;
  className?: string;
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined animate-spin text-tertiary",
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      progress_activity
    </span>
  );
}
