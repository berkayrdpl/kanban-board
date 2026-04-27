import { Skeleton } from "@/components/ui/skeleton";

export default function BoardsLoading() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-16" />
      </header>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <Skeleton className="mb-3 h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <ul className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
          >
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="hidden h-4 w-16 sm:block" />
          </li>
        ))}
      </ul>
    </main>
  );
}
