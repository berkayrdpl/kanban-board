import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <main className="flex h-screen flex-col p-4 sm:p-6">
      <header className="mb-6 flex items-center gap-3 border-b pb-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 flex-1 max-w-xs" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </header>

      <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex w-[280px] shrink-0 flex-col rounded-lg border bg-muted/40 p-3 sm:w-72"
          >
            <Skeleton className="mb-3 h-5 w-32" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 + (i % 2) }).map((__, j) => (
                <Skeleton key={j} className="h-12 rounded-md" />
              ))}
            </div>
            <Skeleton className="mt-3 h-8" />
          </div>
        ))}
      </div>
    </main>
  );
}
