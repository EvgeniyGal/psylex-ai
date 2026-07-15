import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMediatorsLoading() {
  return (
    <section className="space-y-stack-lg">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low/30">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 px-4 py-3">
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="ml-auto h-9 w-36 rounded-full" />
        </div>
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="px-4 py-3"><Skeleton className="h-3 w-20" /></th>
              <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
              <th className="px-4 py-3"><Skeleton className="h-3 w-24" /></th>
              <th className="px-4 py-3"><Skeleton className="h-3 w-12" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-outline-variant/10 last:border-b-0">
                <td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                <td className="px-4 py-3"><Skeleton className="h-8 w-8 rounded-lg" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
