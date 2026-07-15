import { Skeleton } from "@/components/ui/skeleton";

export default function DisputeIntakeLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex h-14 items-center border-b border-hair bg-surface px-gutter">
        <div className="h-5 w-24 animate-pulse rounded bg-hair/50" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-gutter py-stack-lg">
        <div className="text-center">
          <Skeleton className="mx-auto mb-3 h-10 w-56" />
          <Skeleton className="mx-auto h-5 w-72" />
        </div>

        <div className="space-y-5 rounded border border-hair bg-surface-container p-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-24 w-full rounded-md" />
        </div>

        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </main>
    </div>
  );
}
