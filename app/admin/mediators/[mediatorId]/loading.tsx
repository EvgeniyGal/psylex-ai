import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMediatorDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
