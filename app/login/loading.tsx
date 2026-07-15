import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-paper">
      <header className="flex h-14 items-center justify-between border-b border-hair bg-surface px-gutter">
        <div className="h-5 w-24 animate-pulse rounded bg-hair/50" />
        <div className="h-5 w-16 animate-pulse rounded bg-hair/50" />
      </header>

      <div className="relative flex flex-grow items-center justify-center px-6">
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>

          <div className="space-y-5 rounded border border-hair bg-surface-container p-8">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
