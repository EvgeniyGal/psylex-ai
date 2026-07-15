import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  message?: string;
  className?: string;
};

export function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 py-24",
        className,
      )}
    >
      <Spinner size="xl" />
      {message && (
        <p className="text-body-sm text-ink-soft">{message}</p>
      )}
    </div>
  );
}
