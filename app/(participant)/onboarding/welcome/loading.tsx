import { PageLoader } from "@/components/ui/page-loader";

export default function WelcomeLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex h-14 items-center border-b border-hair bg-surface px-gutter">
        <div className="h-5 w-24 animate-pulse rounded bg-hair/50" />
      </header>
      <PageLoader />
    </div>
  );
}
