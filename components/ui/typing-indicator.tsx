import { cn } from "@/lib/utils";

type TypingIndicatorProps = {
  className?: string;
};

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label="AI is thinking"
    >
      <span className="typing-dot h-2 w-2 rounded-full bg-tertiary" />
      <span className="typing-dot h-2 w-2 rounded-full bg-tertiary [animation-delay:150ms]" />
      <span className="typing-dot h-2 w-2 rounded-full bg-tertiary [animation-delay:300ms]" />
    </span>
  );
}
